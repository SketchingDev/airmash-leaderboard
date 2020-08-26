import {AirMashConnection} from "@sketchingdev/airmash-client";
import {app, AppDependencies} from "../../src/app";
import {AdaptorDependencies, gameDataAdaptor} from "../../src/games/gameDataAdaptor";
import {EventBridge} from "aws-sdk";
import {URL} from "url";

jest.setTimeout(10 * 100000);

require('dotenv').config({path: ".env.test"});

describe("Produce login event", () => {
    const playerName = "testing";
    const localServerUrl = new URL("ws://127.0.0.1:3501/ffa");
    const eventBridge: jest.Mocked<Pick<EventBridge, "putEvents">> = {
        putEvents: jest.fn().mockReturnValue({promise: jest.fn().mockResolvedValue(null)})
    }

    test("Snapshot of games saved to DynamoDB", async () => {
        const dependencies: AppDependencies & AdaptorDependencies = {
            eventBridge: eventBridge as any as EventBridge,
            airMashConnection: new AirMashConnection(),
            playerName,
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
            ],
            eventBusName: "default",
            sourceName: "game-bot",
        };

        await gameDataAdaptor(app(dependencies), dependencies)();

        expect(eventBridge.putEvents).toBeCalledWith({
            Entries: [
                expect.objectContaining({
                    DetailType: "login",
                    EventBusName: "default",
                    Source: "game-bot",
                }),
            ],
        });

        const detail = (eventBridge.putEvents.mock.calls[0][0] as any as EventBridge.Types.PutEventsRequest).Entries[0].Detail as string;
        expect(JSON.parse(detail)).toStrictEqual({
            url: "ws://127.0.0.1:3501/ffa",
            timestamp: expect.any(Number),
            gameType: "free-for-all",
            players: []
        });
    });
});

