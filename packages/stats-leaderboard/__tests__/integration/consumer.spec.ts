import {string} from "getenv";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../src/storage/DynamoDbGameSnapshotRepository";
import {app, AppDependencies, LoginEvent} from "../../src/handlers/consumer/app";
import {eventBridgeAdaptor} from "../../src/handlers/consumer/eventBridgeAdaptor";
import {EventBridgeEvent} from "aws-lambda";
import {URL} from "url";
import {v4} from "uuid";
import {addHours, subHours} from "date-fns";

jest.setTimeout(10 * 100000);

require('dotenv').config({path: ".env.test"});

describe("Take snapshots of Games", () => {
    const url = new URL("ws://127.0.0.1:3501/ffa");
    let gameSnapshotRepository: DynamoDbGameSnapshotRepository;

    beforeAll(() => {
        gameSnapshotRepository = new DynamoDbGameSnapshotRepository(
            new DynamoDB({region: "us-east-1"}),
            string("GAME_TABLE_NAME")
        );
    });

    test("Snapshot of games saved to DynamoDB", async () => {
        const playerName = v4();
        const playerLevel = 4;
        const airplane = {id: 1, name: "predator"};

        const event: EventBridgeEvent<"login", LoginEvent> = {
            version: "0",
            id: "2f2bce7b-8724-21c7-a8bc-c996f415fa59",
            "detail-type": "login",
            source: "game-bot",
            account: "794559416598",
            time: "2020-08-03T20:33:39Z",
            region: "us-east-1",
            resources: [],
            detail: {
                url,
                login: {
                    c: 0,
                    success: true,
                    id: 1047,
                    team: 1047,
                    clock: 57948112,
                    token: "41b29ef8b7818075",
                    type: 1,
                    room: "ab-ffa",
                    players: [
                        {
                            id: 1047,
                            status: 0,
                            level: 0,
                            name: "bot-with-login-id",
                            type: 1,
                            team: 1047,
                            posX: 727,
                            posY: -3689,
                            rot: 0,
                            flag: 97,
                            upgrades: 8
                        },
                        {
                            id: 123,
                            status: 0,
                            level: playerLevel,
                            name: playerName,
                            type: airplane.id,
                            team: 1047,
                            posX: 727,
                            posY: -3689,
                            rot: 0,
                            flag: 97,
                            upgrades: 8
                        }
                    ],
                    serverConfiguration: JSON.stringify({sf: 5500, botsNamePrefix: ""}),
                    bots: []
                }
            }
        };

        const dependencies: AppDependencies = {gameSnapshotRepository};
        await eventBridgeAdaptor(app(dependencies))(event, {} as any, jest.fn());

        const snapshots = await gameSnapshotRepository.findByDateRange(url,
            {from: subHours(new Date(), 1), to: addHours(new Date(), 1)}
        );

        expect(snapshots).toMatchObject(expect.arrayContaining([expect.objectContaining({
            players: [
                {
                    name: playerName,
                    accountLevel: playerLevel,
                    airplaneType: airplane.name
                }
            ]
        })]))
    });
});

