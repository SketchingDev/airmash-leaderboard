import {int, string} from "getenv";
import {APIGatewayProxyHandler} from "aws-lambda";
import {httpQueryAdaptor} from "./httpQueryAdaptor";
import {leaderboard, LeaderboardDependencies} from "./leaderboard";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../storage/DynamoDbGameSnapshotRepository";

const gameTableName = string("GAME_TABLE_NAME");
const dynamoDbRegion = string('DYNAMODB_REGION', "us-east-1");
const corsOrigin = string("CORS_ORIGIN", "*");
const leaderboardSize = int("LEADERBOARD_SIZE");
const minAccountLevel = int("MIN_ACCOUNT_LEVEL");

const deps: LeaderboardDependencies = {
    gameSnapshotRepository: new DynamoDbGameSnapshotRepository(
        new DynamoDB.DocumentClient({region: dynamoDbRegion}),
        gameTableName
    ),
    leaderboardSize,
    minAccountLevel,
    getNow: () => new Date()
}

export const handler: APIGatewayProxyHandler = httpQueryAdaptor(leaderboard(deps), {corsOrigin});
