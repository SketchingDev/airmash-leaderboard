import {string} from "getenv";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../src/storage/DynamoDbGameSnapshotRepository";
import {app, AppDependencies} from "../../src/handlers/consumer/app";
import {eventBridgeAdaptor} from "../../src/handlers/consumer/eventBridgeAdaptor";
import {EventBridgeEvent} from "aws-lambda";
import {v4} from "uuid";
import {getWeek} from "date-fns";
import {LoggedInEvent} from "../../src/events/LoggedInEvent";

jest.setTimeout(10 * 100000);

require('dotenv').config({path: ".env.test"});

describe("Take snapshots of Games", () => {
    let gameSnapshotRepository: DynamoDbGameSnapshotRepository;

    let documentClient: DynamoDB.DocumentClient;
    const playerNamesToCleanup: string[] = [];

    beforeAll(() => {
        documentClient = new DynamoDB.DocumentClient({region: "us-east-1"});
        gameSnapshotRepository = new DynamoDbGameSnapshotRepository(
            documentClient,
            string("GAME_TABLE_NAME")
        );
    });

    afterAll(async () => {
        for (const playerName of playerNamesToCleanup) {
            console.log(`Deleting ${playerName}`);
            await documentClient.delete({
                TableName: string("GAME_TABLE_NAME"),
                Key: {playerName}
            }).promise();
        }
    });

    test("Snapshot of games saved to DynamoDB", async () => {
        const playerName = v4();
        const playerLevel = 4;

        const event: EventBridgeEvent<"login", LoggedInEvent> = {
            version: "0",
            id: "2f2bce7b-8724-21c7-a8bc-c996f415fa59",
            "detail-type": "login",
            source: "game-bot",
            account: "794559416598",
            time: "2020-08-03T20:33:39Z",
            region: "us-east-1",
            resources: [],
            detail: {
                url: `wss://${v4()}/ffa`,
                timestamp: Date.now(),
                gameType: "free-for-all",
                players: [
                    {
                        name: playerName,
                        accountLevel: playerLevel,
                        airplaneType:  "predator"
                    }
                ]
            }
        };
        playerNamesToCleanup.push(playerName);

        const deps: AppDependencies = {gameSnapshotRepository};
        await eventBridgeAdaptor(app(deps))(event, {} as any, jest.fn());

        const snapshots = await gameSnapshotRepository.findPlayerLevelsByWeek(getWeek(Date.now()));
        expect(snapshots).toMatchObject(expect.arrayContaining(
            [{
                level: playerLevel,
                playerName: playerName,
                snapshotTimestamp: expect.any(Date),
                week: `${getWeek(Date.now())}`
            }]
        ));
    });
});

