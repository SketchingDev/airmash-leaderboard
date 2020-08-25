import {EventBridgeHandler} from "aws-lambda";
import {app, AppDependencies} from "./app";
import {eventBridgeAdaptor} from "./eventBridgeAdaptor";
import BadWordsFilter from "bad-words";
import {EventBridge} from "aws-sdk";
import {LoggedInEvent} from "./events/LoggedInEvent";

const deps: AppDependencies = {
    badWordFilter: new BadWordsFilter(),
    eventBridge: new EventBridge(),
    logger: console
}

export const handler: EventBridgeHandler<"login", LoggedInEvent, any> = eventBridgeAdaptor(app(deps));
