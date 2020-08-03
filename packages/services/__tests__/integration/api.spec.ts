import {string} from "getenv";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../src/storage/DynamoDbGameSnapshotRepository";
import {URL} from "url";
import {GameType} from "../../src/airmash/GameType";
import {AdaptorDependencies, httpQueryAdaptor} from "../../src/handlers/api/httpQueryAdaptor";
import {v4} from "uuid";
import {GameSnapshot} from "../../src/storage/GameSnapshotRepository";
import {leaderboard, LeaderboardDependencies} from "../../src/handlers/api/leaderboard";
import {AirplaneType} from "../../src/airmash/AirplaneType";
import {GameUrl} from "../../src/airmash/GameUrl";

jest.setTimeout(10 * 100000);

require('dotenv').config({path: ".env.test"});

describe("API returns leaderboard from snapshot", () => {
    let gameUrl1: GameUrl;
    let gameUrl2: GameUrl;

    let gameSnapshotRepository: DynamoDbGameSnapshotRepository;

    beforeAll(() => {
        gameSnapshotRepository = new DynamoDbGameSnapshotRepository(
            new DynamoDB({region: "us-east-1"}),
            string("GAME_TABLE_NAME")
        );
    });

    beforeEach(() => {
        gameUrl1 = {
            gameType: "1",
            name: {
                long: "Free For All #1",
                short: "FFA #1"
            },
            regionId: "eu",
            roomId: "ffa1",
            url: new URL(`wss://${v4()}/ffa`),
        };
        gameUrl2 = {
            gameType: "1",
            name: {
                long: "Free For All #2",
                short: "FFA #2"
            },
            regionId: "eu",
            roomId: "ffa2",
            url: new URL(`wss://${v4()}/ffa`),
        };
    })

    test("Leaderboard contains players from multiple game servers", async () => {
        const snapshotOfUrl1: GameSnapshot = {
            url: gameUrl1.url,
            timestamp: new Date(),
            gameType: GameType.FreeForAll,
            players: [
                {
                    name: "Test Player 1",
                    airplaneType: AirplaneType.Goliath,
                    accountLevel: 20,
                }
            ]
        };
        const snapshotOfUrl2: GameSnapshot = {
            url: gameUrl2.url,
            timestamp: new Date(),
            gameType: GameType.FreeForAll,
            players: [
                {
                    name: "Test Player 2",
                    airplaneType: AirplaneType.Goliath,
                    accountLevel: 50,
                }
            ]
        };

        await gameSnapshotRepository.saveAll([snapshotOfUrl1, snapshotOfUrl2]);

        const deps: LeaderboardDependencies & AdaptorDependencies = {
            gameSnapshotRepository,
            corsOrigin: "*",
            timespanInDays: 1,
            leaderboardSize: 2,
            minAccountLevel: 0,
            gameDataLoader: async () => [gameUrl1, gameUrl2]
        };

        const response = await httpQueryAdaptor(leaderboard(deps), deps)({} as any, {} as any, {} as any);
        expect(response).toStrictEqual({
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                hasError: false,
                data: {
                    players: [
                        {name: "Test Player 2", level: 50},
                        {name: "Test Player 1", level: 20}
                    ]
                }
            })
        });
    });

    test("Leaderboard contains a players highest account level from snapshots", async () => {
        const snapshotOfUrl1: GameSnapshot = {
            url: gameUrl1.url,
            timestamp: new Date(),
            gameType: GameType.FreeForAll,
            players: [
                {
                    name: "Test Player 3",
                    airplaneType: AirplaneType.Goliath,
                    accountLevel: 12,
                }
            ]
        };
        const snapshotOfUrl2: GameSnapshot = {
            url: gameUrl2.url,
            timestamp: new Date(),
            gameType: GameType.FreeForAll,
            players: [
                {
                    name: "Test Player 3",
                    airplaneType: AirplaneType.Goliath,
                    accountLevel: 13,
                }
            ]
        };

        await gameSnapshotRepository.saveAll([snapshotOfUrl1, snapshotOfUrl2]);

        const deps: LeaderboardDependencies = {
            gameSnapshotRepository,
            timespanInDays: 1,
            leaderboardSize: 2,
            minAccountLevel: 0,
            gameDataLoader: async () => [gameUrl1, gameUrl2]
        };

        const response = await httpQueryAdaptor(leaderboard(deps), {corsOrigin: "*"})({} as any, {} as any, {} as any);
        expect(response).toStrictEqual({
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                hasError: false,
                data: {
                    players: [{name: "Test Player 3", level: 13}]
                }
            })
        });
    });
});
