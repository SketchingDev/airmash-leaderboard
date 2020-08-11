import {SaveLogin} from "./app";
import {EventBridgeHandler} from "aws-lambda";
import {LoggedInEvent} from "../../events/LoggedInEvent";

export const eventBridgeAdaptor = (next: SaveLogin): EventBridgeHandler<"login", LoggedInEvent, any> =>
    async (event, _) => {
        console.log('Received event', console.log('Received event:', JSON.stringify(event, null, 2)));
        await next(event.detail);
    }
