import {string} from "getenv";
import {EventBridgeHandler} from "aws-lambda";
import {DynamoDB} from "aws-sdk";
import {app, AppDependencies, LoginEvent} from "./app";
import {DynamoDbGameSnapshotRepository} from "../../storage/DynamoDbGameSnapshotRepository";
import {eventBridgeAdaptor} from "./eventBridgeAdaptor";

const gameTableName = string("GAME_TABLE_NAME");
const dynamoDbRegion = string('DYNAMODB_REGION', "us-east-1");

const deps: AppDependencies = {
    gameSnapshotRepository: new DynamoDbGameSnapshotRepository(
        new DynamoDB({region: dynamoDbRegion}),
        gameTableName
    )
}

export const handler: EventBridgeHandler<"login", LoginEvent, any> = eventBridgeAdaptor(app(deps));
