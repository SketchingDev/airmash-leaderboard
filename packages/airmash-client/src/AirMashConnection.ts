import WebSocket from "ws";
import {
    CLIENT_PACKETS,
    ClientPackets,
    marshalClientMessage,
    ProtocolPacket,
    SERVER_PACKETS,
    ServerPackets,
    WSPacket
} from "@airbattle/protocol";
import {Duplex} from "stream";
import {replyToPing} from "./listeners/replyToPing";
import {reEmit} from "./listeners/reEmit";
import {addAcknowledgementListeners} from "./listeners/addAcknowledgementListeners";
import {tryUnmarshalServerMessage} from "./tryUnmarshalServerMessage";
import {URL} from "url";
import EventEmitter = NodeJS.EventEmitter;

const isLoginResponse = (packet: ProtocolPacket): packet is ServerPackets.Login => packet.c === SERVER_PACKETS.LOGIN;

export interface Client {
    send<T extends ProtocolPacket>(packet: T): boolean;
}

export interface Sockets {
    primary?: WebSocket;
    backup?: WebSocket;
}

export enum ConnectionEventTypes {
    CONNECTED = 'connected',
    MESSAGE = 'message',
    ERROR = 'error'
}

// TODO Produce connected event when both primary and backup connections are made

/**
 * Manages logging in to a game host and persisting the connection.
 */
export class AirMashConnection {
    private static LOGIN_TIMEOUT = 3 * 1000;
    private static WEBSOCKET_FACTORY = (url: string): WebSocket => new WebSocket(url);

    private readonly eventEmitter: EventEmitter = new Duplex();

    private sockets: Sockets = {
        primary: undefined,
        backup: undefined,
    }

    public get readableEvents(): Omit<EventEmitter, 'emit'> {
        return this.eventEmitter;
    }

    private readonly client: Client = {
        send: (packet: ProtocolPacket): boolean => {
            if (this.sockets.primary?.readyState === WebSocket.OPEN) {
                this.sockets.primary.send(marshalClientMessage(packet));
                return true;
            }

            if (this.sockets.backup?.readyState === WebSocket.OPEN) {
                this.sockets.backup.send(marshalClientMessage(packet));
                return true;
            }

            return false;
        }
    }

    private readonly reEmitter = reEmit(this.client, this.eventEmitter);

    public constructor(
        private readonly webSocketFactory: (url: string) => WebSocket = AirMashConnection.WEBSOCKET_FACTORY) {
    }

    private createConnection(url: string): WebSocket {
        const socket = this.webSocketFactory(url);
        socket.binaryType = "arraybuffer";

        addAcknowledgementListeners(socket);
        socket.addEventListener('message', (event) => {
            const serverMessage = tryUnmarshalServerMessage(event.data);
            if (serverMessage) {
                this.reEmitter(serverMessage);
                replyToPing(event.target, serverMessage);
            }
        });

        return socket;
    }

    private createPrimaryConnection(url: string, name:string, onLoginResponse: (login: ServerPackets.Login) => void): WebSocket {
        const socket = this.createConnection(url);

        socket.addEventListener('open', () => {
            this.client.send<ClientPackets.Login>({
                c: CLIENT_PACKETS.LOGIN,
                flag: "GB",
                horizonX: 987,
                horizonY: 264,
                name,
                protocol: 5,
                session: "none",
            });
        });

        socket.addEventListener('message', (event): void => {
            const serverMessage = tryUnmarshalServerMessage(event.data);
            if (serverMessage && isLoginResponse(serverMessage)) {
                onLoginResponse(serverMessage);
            }
        });

        return socket;
    }

    private createBackupConnection(url: string, login: ServerPackets.Login): WebSocket {
        const socket = this.createConnection(url);

        socket.addEventListener('open', (): void => {
            if (typeof login.token === 'string') {
                const backupPacket: ClientPackets.Backup & WSPacket = {
                    c: CLIENT_PACKETS.BACKUP,
                    token: login.token,
                }

                socket.send(marshalClientMessage(backupPacket));
                this.eventEmitter.emit(ConnectionEventTypes.CONNECTED);
            } else {
                throw new Error("Failed to login backup connection as token wasn't provided by host");
            }
        });

        return socket;
    }

    public login(roomUrl: URL | string, name:string, timeoutInMs: number = AirMashConnection.LOGIN_TIMEOUT): Promise<void> {
        // TODO Move room URL to constructor? Otherwise login could be called multiple times.
        let loginTimeoutHandler: NodeJS.Timeout;

        return new Promise((resolve, reject) => {
            const initiateBackupConnection = ((login: ServerPackets.Login): void => {
                this.sockets.backup = this.createBackupConnection(roomUrl.toString(), login);
            });

            this.sockets.primary = this.createPrimaryConnection(roomUrl.toString(), name, initiateBackupConnection);
            const primaryConnectionError = (event: { error: any, message: any, type: string, target: WebSocket }) => {
                this.sockets.primary?.removeListener('error', primaryConnectionError);
                console.error(`Failure with ${roomUrl.toString()}`);
                reject(event.error);
            }

            this.sockets.primary.addEventListener('error', primaryConnectionError);

            const connectedHandler = (): void => {
                this.sockets.primary?.removeListener('error', primaryConnectionError);
                this.eventEmitter.removeListener(ConnectionEventTypes.CONNECTED, connectedHandler);

                if (loginTimeoutHandler) {
                    clearInterval(loginTimeoutHandler);
                }
                resolve();
            };
            this.eventEmitter.addListener(ConnectionEventTypes.CONNECTED, connectedHandler);

            loginTimeoutHandler = setInterval(() => {
                clearInterval(loginTimeoutHandler);
                this.logout();
                reject(new Error(`Expected login handshake timed out for ${roomUrl}`));
            }, timeoutInMs);
        });
    }

    /**
     * Extracts details about the room and its players by partially logging in i.e. stopping short of the full login
     * process to prevent a user appearing as a player in the room.
     */
    public partialLogin(roomUrl: URL | string, name: string, timeoutInMs: number = AirMashConnection.LOGIN_TIMEOUT): Promise<ServerPackets.Login> {
        let loginTimeoutHandler: NodeJS.Timeout;
        let login: ServerPackets.Login | undefined;

        return new Promise((resolve, reject) => {
            const onLogin = ((l: ServerPackets.Login): void => {
                login = l;
                this.logout();
            });

            this.sockets.primary = this.createPrimaryConnection(roomUrl.toString(), name, onLogin);

            this.sockets.primary.addEventListener('close', () => {
                clearInterval(loginTimeoutHandler);
                if (login) {
                    resolve(login);
                } else {
                    reject("Connection closed without providing login details");
                }
            });
            this.sockets.primary.addEventListener('error', (event: { error: any, message: any, type: string, target: WebSocket }) => {
                clearInterval(loginTimeoutHandler);
                this.logout();

                reject(event.error);
            });
            loginTimeoutHandler = setInterval(() => {
                clearInterval(loginTimeoutHandler);
                this.logout();
            }, timeoutInMs);
        });

    }

    public logout(): void {
        const closeElseUseForce = (ws: WebSocket) => {
            switch (ws.readyState) {
                case WebSocket.OPEN:
                    return ws.close();
                case WebSocket.CONNECTING:
                    return ws.terminate();
            }
        }
        if (this.sockets.primary) {
            closeElseUseForce(this.sockets.primary);
        }
        if (this.sockets.backup) {
            closeElseUseForce(this.sockets.backup);
        }
    }
}
