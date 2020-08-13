import {EventBridgeHandler} from "aws-lambda";
import {app, AppDependencies} from "./app";
import {eventBridgeAdaptor} from "./eventBridgeAdaptor";
import {LoggedInEvent} from "../../events/LoggedInEvent";
import {DynamoDbGameSnapshotRepository} from "../../storage/DynamoDbGameSnapshotRepository";
import {DynamoDB} from "aws-sdk";
import {string} from "getenv";

const gameTableName = string("GAME_TABLE_NAME");
const dynamoDbRegion = string('DYNAMODB_REGION', "us-east-1");

const deps: AppDependencies = {
    gameSnapshotRepository:
        new DynamoDbGameSnapshotRepository(
            new DynamoDB.DocumentClient({region: dynamoDbRegion}),
            gameTableName
        )
}

export const handler: EventBridgeHandler<"login", LoggedInEvent, any> = eventBridgeAdaptor(app(deps));
