import {EventBridgeHandler} from "aws-lambda";
import {LoggedInEvent} from "./events/LoggedInEvent";
import {FilterPlayers} from "./app";

export const eventBridgeAdaptor = (next: FilterPlayers): EventBridgeHandler<"login", LoggedInEvent, any> =>
    async (event, _) => {
        console.log('Received event', console.log('Received event:', JSON.stringify(event, null, 2)));
        await next(event.detail);
    }
