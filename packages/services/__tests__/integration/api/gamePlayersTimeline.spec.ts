import {string} from "getenv";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../../src/storage/DynamoDbGameSnapshotRepository";
import {URL} from "url";
import {GameType} from "../../../src/airmash/GameType";
import {httpQueryAdaptor} from "../../../src/api/httpQueryAdaptor";
import {APIGatewayProxyEvent} from "aws-lambda/trigger/api-gateway-proxy";
import {v4} from "uuid";
import {GameSnapshot} from "../../../src/storage/GameSnapshotRepository";
import {subDays, subHours} from 'date-fns';
import {playersTimeline, PlayersTimelineDependencies} from "../../../src/api/gameDetails/playersTimeline";
import {AirplaneType} from "../../../src/airmash/AirplaneType";

jest.setTimeout(10 * 100000);

require('dotenv').config({path: ".env.test"});

describe("Timeline of players for a game", () => {
    let gameUrl: URL;
    let gameSnapshotRepository: DynamoDbGameSnapshotRepository;

    beforeAll(() => {
        gameSnapshotRepository = new DynamoDbGameSnapshotRepository(
            new DynamoDB({region: "us-east-1"}),
            string("GAME_TABLE_NAME")
        );
    });

    beforeEach(() => {
        gameUrl = new URL(`wss://${v4()}/ffa`);
    })

    test("Count players within within timespan", async () => {
        const timespanInDays = 1;

        const now = new Date();
        const oneDayOneHourAgo = subHours(subDays(now, timespanInDays), 1);

        const snapshotFromNow: GameSnapshot = {
            url: gameUrl,
            timestamp: now,
            gameType: GameType.FreeForAll,
            players: [
                {
                    name: "Test Player In Scope",
                    airplaneType: AirplaneType.Goliath,
                    accountLevel: 0,
                }
            ]
        };
        const snapshotFromOneDayOneHour: GameSnapshot = {
            url: gameUrl,
            timestamp: oneDayOneHourAgo,
            gameType: GameType.CaptureTheFlag,
            players: [
                {
                    name: "Test Player Out Of Scope",
                    airplaneType: AirplaneType.Copter,
                    accountLevel: 0,
                }
            ]
        };
        await gameSnapshotRepository.saveAll([snapshotFromNow, snapshotFromOneDayOneHour]);

        const event: Partial<APIGatewayProxyEvent> = {
            pathParameters: {url: encodeURIComponent(gameUrl.toString())}
        };

        const deps: PlayersTimelineDependencies = {
            gameSnapshotRepository,
            timespanInDays
        };
        const response = await httpQueryAdaptor(playersTimeline(deps), {corsOrigin: "*"})(
            event as APIGatewayProxyEvent, {} as any, {} as any
        );

        expect(response).toStrictEqual({
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(
                {
                    hasError: false,
                    data: {
                        url: gameUrl,
                        playersTimeline: [{timestamp: snapshotFromNow.timestamp, totalRealPlayers: 1}]
                    }
                }
            )
        });
    });
});
