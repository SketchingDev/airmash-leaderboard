import {ProtocolPacket, unmarshalServerMessage} from "@airbattle/protocol";

export const tryUnmarshalServerMessage = (data: string | Buffer | ArrayBuffer | Buffer[]): ProtocolPacket | undefined => {
    if (data instanceof ArrayBuffer) {
        try {
            const serverMessage = unmarshalServerMessage(data);
            if (typeof serverMessage === 'object') {
                return serverMessage;
            }
        } catch(error) {
            // TODO Is there a better way to handle this
            console.debug("Failed to unmarshal server message", {data, error});
        }
    }

    return undefined;
}
