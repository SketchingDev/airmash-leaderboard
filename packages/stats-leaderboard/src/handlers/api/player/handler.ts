import {APIGatewayProxyHandler} from "aws-lambda";
import {string} from "getenv";
import {httpQueryAdaptor} from "../httpQueryAdaptor";
import {player, PlayerMetricsDependencies} from "./player";
import {DynamoDbGameSnapshotRepository} from "../../../storage/DynamoDbGameSnapshotRepository";
import {DynamoDB} from "aws-sdk";

const gameTableName = string("GAME_TABLE_NAME");
const dynamoDbRegion = string('DYNAMODB_REGION', "us-east-1");
const corsOrigin = string("CORS_ORIGIN", "*");

const deps: PlayerMetricsDependencies = {
    gameSnapshotRepository: new DynamoDbGameSnapshotRepository(
        new DynamoDB.DocumentClient({region: dynamoDbRegion}),
        gameTableName
    )
}

export const handler: APIGatewayProxyHandler = httpQueryAdaptor(player(deps), {corsOrigin});
