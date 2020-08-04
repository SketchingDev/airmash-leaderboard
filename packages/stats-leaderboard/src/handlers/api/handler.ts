import {int, string, url} from "getenv";
import {APIGatewayProxyHandler} from "aws-lambda";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../storage/DynamoDbGameSnapshotRepository";
import {httpQueryAdaptor} from "./httpQueryAdaptor";
import {leaderboard, LeaderboardDependencies} from "./leaderboard";
import {parseGamesFromRemoteFile} from "./games/parseGamesFromRemoteFile";

const gameDataUrl = url("GAME_DATA_URL");
const gameTableName = string("GAME_TABLE_NAME");
const dynamoDbRegion = string('DYNAMODB_REGION', "us-east-1");
const corsOrigin = string("CORS_ORIGIN", "*");
const timespanInDays = int("TIMESPAN_IN_DAYS");
const leaderboardSize = int("LEADERBOARD_SIZE");
const minAccountLevel = int("MIN_ACCOUNT_LEVEL");

const deps: LeaderboardDependencies = {
    gameSnapshotRepository: new DynamoDbGameSnapshotRepository(
        new DynamoDB({region: dynamoDbRegion}),
        gameTableName
    ),
    timespanInDays,
    leaderboardSize,
    minAccountLevel,
    gameDataLoader: () => parseGamesFromRemoteFile(gameDataUrl)
}

export const handler: APIGatewayProxyHandler = httpQueryAdaptor(leaderboard(deps), {corsOrigin});
