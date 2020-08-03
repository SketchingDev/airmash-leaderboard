import {LoginEvent, SaveGame} from "./app";
import {EventBridgeHandler} from "aws-lambda";

export const eventBridgeAdaptor = (next: SaveGame): EventBridgeHandler<"login", LoginEvent, any> =>
    async (event, _) => {
        console.log('Received event', console.log('Received event:', JSON.stringify(event, null, 2)));
        await next(event.detail);
    }
