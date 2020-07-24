import {string, url} from "getenv";
import {ScheduledHandler} from "aws-lambda";
import {AirMashConnection} from "@sketchingdev/airmash-client";
import {parseGamesFromRemoteFile} from "./games/parseGamesFromRemoteFile";
import {app, AppDependencies} from "./app";
import {AdaptorDependencies, gameDataAdaptor} from "./games/gameDataAdaptor";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../storage/DynamoDbGameSnapshotRepository";

const gameDataUrl = url("GAME_DATA_URL");
const gameTableName = string("GAME_TABLE_NAME");
const dynamoDbRegion = string('DYNAMODB_REGION', "us-east-1");
const playerName = string('PLAYER_NAME');

const deps: AdaptorDependencies & AppDependencies = {
    gameSnapshotRepository: new DynamoDbGameSnapshotRepository(
        new DynamoDB({region: dynamoDbRegion}),
        gameTableName
    ),
    airMashConnection: new AirMashConnection(),
    gameDataLoader: () => parseGamesFromRemoteFile(gameDataUrl),
    playerName
}

export const handler: ScheduledHandler = gameDataAdaptor(app(deps), deps);
