import {string} from "getenv";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../src/storage/DynamoDbGameSnapshotRepository";
import {AdaptorDependencies, httpQueryAdaptor} from "../../src/handlers/api/httpQueryAdaptor";
import {v4} from "uuid";
import {player, PlayerMetricsDependencies} from "../../src/handlers/api/player/player";
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {PlayerSnapshot} from "../../src/storage/GameSnapshotRepository";

jest.setTimeout(10 * 100000);

require('dotenv').config({path: ".env.test"});

describe("Player endpoint", () => {
    let gameSnapshotRepository: DynamoDbGameSnapshotRepository;
    let deps: AdaptorDependencies & PlayerMetricsDependencies;

    const playersToCleanup: PlayerSnapshot[] = [];
    let documentClient: DynamoDB.DocumentClient;

    beforeAll(() => {
        documentClient = new DynamoDB.DocumentClient({region: "us-east-1"});
        gameSnapshotRepository = new DynamoDbGameSnapshotRepository(
            documentClient,
            string("GAME_TABLE_NAME")
        );
    });

    afterAll(async () => {
        for (const player of playersToCleanup) {
            console.log(`Deleting ${player.playerName}`);
            try {
                await documentClient.delete({
                    TableName: string("GAME_TABLE_NAME"),
                    Key: {
                        playerName: player.playerName,
                        snapshotTimestamp: player.snapshotTimestamp.toISOString(),
                    }
                }).promise();
            } catch (err) {
                console.error(err);
            }
        }
    });

    beforeEach(() => {
        deps = {
            gameSnapshotRepository,
            corsOrigin: "*",
        };
    })

    test("Last date the player was seen", async () => {
        const playerName = v4();
        const playerSnapshot1: PlayerSnapshot = {
            playerName,
            airplaneType: "goliath",
            level: 1,
            snapshotTimestamp: new Date("2020-08-14T20:25:04.704Z"),
            week: 22
        };
        const playerSnapshot2: PlayerSnapshot = {
            playerName,
            airplaneType: "goliath",
            level: 2,
            snapshotTimestamp: new Date("2020-08-15T20:25:04.704Z"),
            week: 22
        }

        await gameSnapshotRepository.saveSnapshot(playerSnapshot1);
        await gameSnapshotRepository.saveSnapshot(playerSnapshot2);
        playersToCleanup.push(...[playerSnapshot1, playerSnapshot2]);

        const event: Partial<APIGatewayProxyEvent> = {pathParameters: {playerName}};

        const response = await httpQueryAdaptor(player(deps), deps)(event as APIGatewayProxyEvent, {} as any, {} as any);
        expect(response).toMatchObject({
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*"
            }
        });

        const definedResponse = response as APIGatewayProxyResult;
        const body = JSON.parse(definedResponse.body);
        expect(body).toMatchObject({
            hasError: false,
            data: {
                playerFound: true,
                metrics: {
                    name: playerName,
                    level: 2,
                    lastSeenOnline: playerSnapshot2.snapshotTimestamp.toISOString(),
                }
            }
        });
    });

    test("All days the player was seen", async () => {
        const playerName = v4();
        const playerSnapshot1: PlayerSnapshot = {
            playerName,
            airplaneType: "goliath",
            level: 1,
            week: 22,
            snapshotTimestamp: new Date("2020-08-14T20:25:04.704Z")
        };
        const playerSnapshot2: PlayerSnapshot = {
            playerName,
            airplaneType: "goliath",
            level: 2,
            week: 22,
            snapshotTimestamp: new Date("2020-08-15T20:25:04.704Z")
        }
        const playerSnapshot3: PlayerSnapshot = {
            playerName,
            airplaneType: "goliath",
            level: 2,
            week: 22,
            snapshotTimestamp: new Date("2020-08-15T20:40:04.704Z")
        }

        await gameSnapshotRepository.saveSnapshot(playerSnapshot1);
        await gameSnapshotRepository.saveSnapshot(playerSnapshot2);
        await gameSnapshotRepository.saveSnapshot(playerSnapshot3);
        playersToCleanup.push(...[playerSnapshot1, playerSnapshot2, playerSnapshot3]);

        const event: Partial<APIGatewayProxyEvent> = {pathParameters: {playerName}};

        const response = await httpQueryAdaptor(player(deps), deps)(event as APIGatewayProxyEvent, {} as any, {} as any);
        expect(response).toMatchObject({
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*"
            }
        });

        const definedResponse = response as APIGatewayProxyResult;
        const body = JSON.parse(definedResponse.body);
        expect(body).toMatchObject({
            hasError: false,
            data: {
                playerFound: true,
                metrics: {
                    daysSeenOnline: [
                        {date: "2020-08-14", level: 1},
                        {date: "2020-08-15", level: 2}
                    ]
                }
            }
        });
    });

    test("Plane type seen the most", async () => {
        const playerName = v4();
        const playerSnapshot1: PlayerSnapshot = {
            playerName,
            airplaneType: "predator",
            level: 1,
            week: 22,
            snapshotTimestamp: new Date("2020-08-14T20:25:04.704Z")
        };
        const playerSnapshot2: PlayerSnapshot = {
            playerName,
            airplaneType: "predator",
            level: 2,
            week: 22,
            snapshotTimestamp: new Date("2020-08-15T20:25:04.704Z")
        }
        const playerSnapshot3: PlayerSnapshot = {
            playerName,
            airplaneType: "goliath",
            level: 2,
            week: 22,
            snapshotTimestamp: new Date("2020-08-15T20:40:04.704Z")
        }

        await gameSnapshotRepository.saveSnapshot(playerSnapshot1);
        await gameSnapshotRepository.saveSnapshot(playerSnapshot2);
        await gameSnapshotRepository.saveSnapshot(playerSnapshot3);
        playersToCleanup.push(...[playerSnapshot1, playerSnapshot2, playerSnapshot3]);

        const event: Partial<APIGatewayProxyEvent> = {pathParameters: {playerName}};

        const response = await httpQueryAdaptor(player(deps), deps)(event as APIGatewayProxyEvent, {} as any, {} as any);
        expect(response).toMatchObject({
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*"
            }
        });

        const definedResponse = response as APIGatewayProxyResult;
        const body = JSON.parse(definedResponse.body);
        expect(body).toMatchObject({
            hasError: false,
            data: {
                playerFound: true,
                metrics: {
                    planeSeenTheMost: "predator"
                }
            }
        });
    });
});
