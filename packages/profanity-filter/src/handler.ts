import {EventBridgeHandler} from "aws-lambda";
import {app, AppDependencies} from "./app";
import {eventBridgeAdaptor} from "./eventBridgeAdaptor";
import BadWordsFilter from "bad-words";
import {EventBridge} from "aws-sdk";
import {LoggedInEvent} from "./events/LoggedInEvent";
import {string} from "getenv";

const eventBusName = string('EVENT_BUS_NAME', "default");
const sourceName = string('SOURCE_NAME', "profanity-filter");
const wordsExcludedFromFilter: string[] = [
    "god"
];

const deps: AppDependencies = {
    badWordFilter: new BadWordsFilter({exclude: wordsExcludedFromFilter}),
    eventBridge: new EventBridge(),
    logger: console,
    eventBusName,
    sourceName,
}

export const handler: EventBridgeHandler<"login", LoggedInEvent, any> = eventBridgeAdaptor(app(deps));
