import {ProtocolPacket, unmarshalClientMessage, unmarshalServerMessage} from "@airbattle/protocol";
import WebSocket from "ws";

interface WebSocketSpiedOnMethods {
    send: jest.SpyInstance<ReturnType<Required<WebSocket>["send"]>, jest.ArgsType<Required<WebSocket>["send"]>>;
    emit: jest.SpyInstance<ReturnType<Required<WebSocket>["emit"]>, jest.ArgsType<Required<WebSocket>["emit"]>>;
    getMessagesFromClient: () => ProtocolPacket[];
    getMessagesFromServer: () => ProtocolPacket[];
}

interface SocketSpies {
    primary?: WebSocketSpiedOnMethods;
    backup?: WebSocketSpiedOnMethods;
}

const getMessagesFromServer = (spiedOnMethods: WebSocketSpiedOnMethods | undefined): ProtocolPacket[] => {
    const packets: ProtocolPacket[] = [];

    spiedOnMethods?.emit.mock.calls.forEach(c => {
        try {
            packets.push(unmarshalServerMessage(c[1]));
        } catch (err) {
            /* Intentionally ignored */
        }
    });

    return packets;
}

const getMessagesFromClient = (spiedOnMethods: WebSocketSpiedOnMethods | undefined): ProtocolPacket[] => {
    const packets: ProtocolPacket[] = [];

    spiedOnMethods?.send.mock.calls.forEach(c => {
        try {
            packets.push(unmarshalClientMessage(c[0]));
        } catch (err) {
            /* Intentionally ignored */
        }
    });

    return packets;
}

export const createSpySocketFactory = (): {
    factory: (url: string) => WebSocket;
    spies: SocketSpies;
} => {
    const socketsSpies: SocketSpies = {};

    return {
        spies: socketsSpies,
        factory: (url): WebSocket => {
            const websocket = new WebSocket(url);
            if (!socketsSpies.primary) {
                socketsSpies.primary = {
                    send: jest.spyOn<WebSocket, 'send'>(websocket, 'send'),
                    emit: jest.spyOn<WebSocket, 'emit'>(websocket, 'emit'),
                    getMessagesFromClient: (): ProtocolPacket[] => getMessagesFromClient(socketsSpies.primary),
                    getMessagesFromServer: (): ProtocolPacket[] => getMessagesFromServer(socketsSpies.primary),
                }
                return websocket;
            }
            if (!socketsSpies.backup) {
                socketsSpies.backup = {
                    send: jest.spyOn<WebSocket, 'send'>(websocket, 'send'),
                    emit: jest.spyOn<WebSocket, 'emit'>(websocket, 'emit'),
                    getMessagesFromClient: (): ProtocolPacket[] => getMessagesFromClient(socketsSpies.backup),
                    getMessagesFromServer: (): ProtocolPacket[] => getMessagesFromServer(socketsSpies.backup),
                }
                return websocket;
            }
            throw new Error("Factory called more than twice");
        }
    }
}
