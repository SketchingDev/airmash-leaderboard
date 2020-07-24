import {AirMashConnection} from "@sketchingdev/airmash-client";
import {app, AppDependencies} from "../../src/snapshotGames/app";
import {AdaptorDependencies, gameDataAdaptor} from "../../src/snapshotGames/games/gameDataAdaptor";
import {string} from "getenv";
import {DynamoDB} from "aws-sdk";
import {DynamoDbGameSnapshotRepository} from "../../src/storage/DynamoDbGameSnapshotRepository";
import {URL} from "url";
import {v4} from "uuid";

jest.setTimeout(10 * 100000);

require('dotenv').config({path: ".env.test"});

describe("Take snapshots of Games", () => {
    const localServerUrl = new URL("ws://127.0.0.1:3501/ffa");
    // const localServerUrl = new URL("wss://eu.airmash.online/ffa2");

    let gameSnapshotRepository: DynamoDbGameSnapshotRepository;
    let airMashConnection: AirMashConnection;

    beforeAll(() => {
        airMashConnection = new AirMashConnection();

        gameSnapshotRepository = new DynamoDbGameSnapshotRepository(
            new DynamoDB({region: "us-east-1"}),
            string("GAME_TABLE_NAME")
        );
    });

    test("Snapshot of games saved to DynamoDB", async () => {
        const playerName = `${v4()}`;
        await airMashConnection.login(localServerUrl, playerName);

        const dependencies: AppDependencies & AdaptorDependencies = {
            gameSnapshotRepository,
            airMashConnection: new AirMashConnection(),
            playerName: "testing",
            gameDataLoader: async () => [
                {
                    gameType: "1",
                    name: {
                        long: "Free For All #1",
                        short: "FFA #1"
                    },
                    regionId: "eu",
                    roomId: "ffa1",
                    url: localServerUrl,
                }
            ]
        };

        await gameDataAdaptor(app(dependencies), dependencies)();


    });
});

