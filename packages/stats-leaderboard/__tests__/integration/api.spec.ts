import {string} from "getenv";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository, PlayerSnapshot} from "../../src/storage/DynamoDbGameSnapshotRepository";
import {AdaptorDependencies, httpQueryAdaptor} from "../../src/handlers/api/httpQueryAdaptor";
import {v4} from "uuid";
import {leaderboard, LeaderboardDependencies} from "../../src/handlers/api/leaderboard";
import {addHours, getWeek} from "date-fns";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";

jest.setTimeout(10 * 100000);

require('dotenv').config({path: ".env.test"});

describe("API returns leaderboard from snapshot", () => {
    let gameSnapshotRepository: DynamoDbGameSnapshotRepository;
    let deps: LeaderboardDependencies & AdaptorDependencies;

    const playerNamesToCleanup: string[] = [];
    let documentClient: DynamoDB.DocumentClient;

    beforeAll(() => {
        documentClient = new DynamoDB.DocumentClient({region: "us-east-1"});
        gameSnapshotRepository = new DynamoDbGameSnapshotRepository(
            documentClient,
            string("GAME_TABLE_NAME")
        );
    });

    afterAll(async () => {
        for(const playerName of playerNamesToCleanup) {
            console.log(`Deleting ${playerName}`);
            await documentClient.delete({
                TableName: string("GAME_TABLE_NAME"),
                Key: { playerName }
            }).promise();
        }
    });

    beforeEach(() => {
        deps = {
            gameSnapshotRepository,
            corsOrigin: "*",
            leaderboardSize: 20,
            minAccountLevel: 0,
            getCurrentWeek: () => getWeek(Date.now())
        };
    })

    test("Leaderboard contains players from multiple game servers", async () => {
        const snapshotTimestamp = new Date().toISOString();

        const player1Snapshot: PlayerSnapshot = {
            playerName: v4(),
            airplaneType: "goliath",
            level: 50,
            snapshotTimestamp,
            week: getWeek(Date.now())
        };
        const player2Snapshot: PlayerSnapshot = {
            playerName: v4(),
            airplaneType: "goliath",
            level: 50,
            snapshotTimestamp,
            week: getWeek(Date.now())
        };

        await gameSnapshotRepository.saveSnapshot(player1Snapshot);
        await gameSnapshotRepository.saveSnapshot(player2Snapshot);
        playerNamesToCleanup.push(...[player1Snapshot.playerName, player2Snapshot.playerName]);

        const response = await httpQueryAdaptor(leaderboard(deps), deps)({} as any, {} as any, {} as any);
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
                players: expect.arrayContaining([
                    {name: player1Snapshot.playerName, level: 50},
                    {name: player2Snapshot.playerName, level: 50}
                ])
            }
        });
    });

    test("Leaderboard contains a players highest account level from snapshots", async () => {
        const playerName = v4();
        const playerSnapshot1: PlayerSnapshot = {
            playerName,
            airplaneType: "goliath",
            level: 10,
            snapshotTimestamp: new Date().toISOString(),
            week: getWeek(Date.now())
        };
        const playerSnapshot2: PlayerSnapshot = {
            playerName,
            airplaneType: "predator",
            level: 12,
            snapshotTimestamp: addHours(new Date(), 1).toISOString(),
            week: getWeek(Date.now())
        };

        await gameSnapshotRepository.saveSnapshot(playerSnapshot1);
        await gameSnapshotRepository.saveSnapshot(playerSnapshot2);
        playerNamesToCleanup.push(playerName);

        const response = await httpQueryAdaptor(leaderboard(deps), deps)({} as any, {} as any, {} as any);
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
                players: expect.arrayContaining([
                    {name: playerName, level: 12},
                ])
            }
        });
    });
});
