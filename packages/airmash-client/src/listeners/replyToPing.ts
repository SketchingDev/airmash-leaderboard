import WebSocket from "ws";
import {CLIENT_PACKETS, marshalClientMessage, ProtocolPacket, SERVER_PACKETS, ServerPackets} from "@airbattle/protocol";

const isPingResponse = (packet: ProtocolPacket): packet is ServerPackets.Ping => packet.c === SERVER_PACKETS.PING;

export const replyToPing = (target: WebSocket, packet: ProtocolPacket): void => {
    if (isPingResponse(packet)) {
        target.send(marshalClientMessage({
            c: CLIENT_PACKETS.PONG,
            ...(packet.num ? {num: packet.num} : {}),
        }));
    }
}
