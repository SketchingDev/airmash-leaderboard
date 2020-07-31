import {int, string} from "getenv";
import {APIGatewayProxyHandler} from "aws-lambda";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../storage/DynamoDbGameSnapshotRepository";
import {httpQueryAdaptor} from "../httpQueryAdaptor";
import {playersTimeline, PlayersTimelineDependencies} from "./playersTimeline";

const gameTableName = string("GAME_TABLE_NAME");
const dynamoDbRegion = string('DYNAMODB_REGION', "us-east-1");
const corsOrigin = string("CORS_ORIGIN", "*");
const timespanInDays = int("TIMESPAN_IN_DAYS");

const deps: PlayersTimelineDependencies = {
    gameSnapshotRepository: new DynamoDbGameSnapshotRepository(
        new DynamoDB({region: dynamoDbRegion}),
        gameTableName
    ),
    timespanInDays
}

export const handler: APIGatewayProxyHandler = httpQueryAdaptor(playersTimeline(deps), {corsOrigin});
