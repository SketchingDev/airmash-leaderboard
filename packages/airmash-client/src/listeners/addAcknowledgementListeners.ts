import WebSocket from "ws";
import {CLIENT_PACKETS, marshalClientMessage} from "@airbattle/protocol";

export const addAcknowledgementListeners = (socket: WebSocket, interval = 1000): void => {
    let acknowledgmentHandler: NodeJS.Timeout;

    socket.addEventListener('open', () => {
        acknowledgmentHandler = setInterval(() => {
            socket.send(marshalClientMessage({c: CLIENT_PACKETS.ACK}));
        }, interval);
    });
    socket.addEventListener('close', () => {
        if (acknowledgmentHandler) {
            clearTimeout(acknowledgmentHandler);
        }
    });
}
