import {string, url} from "getenv";
import {ScheduledHandler} from "aws-lambda";
import {AirMashConnection} from "@sketchingdev/airmash-client";
import {parseGamesFromRemoteFile} from "./games/parseGamesFromRemoteFile";
import {app, AppDependencies} from "./app";
import {AdaptorDependencies, gameDataAdaptor} from "./games/gameDataAdaptor";
import {EventBridge} from "aws-sdk";

const gameDataUrl = url("GAME_DATA_URL");
const playerName = string('PLAYER_NAME');
const eventBusName = string('EVENT_BUS_NAME', "default");
const sourceName = string('SOURCE_NAME', "game-bot");

const deps: AdaptorDependencies & AppDependencies = {
    airMashConnection: new AirMashConnection(),
    eventBridge: new EventBridge(),
    gameDataLoader: () => parseGamesFromRemoteFile(gameDataUrl),
    playerName,
    eventBusName,
    sourceName
}

export const handler: ScheduledHandler = gameDataAdaptor(app(deps), deps);
