import {ProtocolPacket, SERVER_PACKETS, ServerPackets} from "@airbattle/protocol";
import {Client} from "../AirMashConnection";
import EventEmitter = NodeJS.EventEmitter;

const isErrorResponse = (packet: ProtocolPacket): packet is ServerPackets.Error => packet.c === SERVER_PACKETS.ERROR;

export interface HandlerArgs {
    client: Client,
    message: ProtocolPacket
}

export const reEmit = (client: Client, eventEmitter: EventEmitter): (packet: ProtocolPacket) => void =>
    (packet: ProtocolPacket): void => {
        if (isErrorResponse(packet)) {
            eventEmitter.emit('error2', {client, message: packet});
        }
        eventEmitter.emit('message', {client, message: packet});
    };
