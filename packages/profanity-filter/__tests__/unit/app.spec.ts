import {EventBridgeEvent} from "aws-lambda";
import {LoggedInEvent} from "../../src/events/LoggedInEvent";
import {eventBridgeAdaptor} from "../../src/eventBridgeAdaptor";
import {app, AppDependencies} from "../../src/app";
import BadWordsFilter from "bad-words";
import {EventBridge} from "aws-sdk";
import {Player} from "@sketchingdev/stats-leaderboard/src/events/LoggedInEvent";
import {v4} from "uuid";

describe("Profanity Filter", () => {
    test("Produces Login event with profane names removed", async () => {
        const eventBridge: jest.Mocked<Pick<EventBridge, 'putEvents'>> = {
            putEvents: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue(undefined)
            })
        };

        const insultingWord = "twee";
        const deps: AppDependencies = {
            badWordFilter: new BadWordsFilter({list: [insultingWord]}),
            eventBridge: eventBridge as any as EventBridge,
            logger: {info: jest.fn()},
            eventBusName: "",
            sourceName: "",
        }

        const profanePlayer: Player = {
            name: `You're all ${insultingWord}`,
            accountLevel: 0,
            airplaneType: "predator"
        }

        const politePlayer: Player = {
            name: "The Mighty Austen",
            accountLevel: 0,
            airplaneType: "predator"
        }

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
                players: [profanePlayer, politePlayer]
            }
        };

        await eventBridgeAdaptor(app(deps))(event, {} as any, jest.fn());

        const detail = (eventBridge.putEvents.mock.calls[0][0] as any as EventBridge.Types.PutEventsRequest).Entries[0].Detail as string;
        expect(JSON.parse(detail)).toStrictEqual({
            url: event.detail.url,
            timestamp: event.detail.timestamp,
            gameType: event.detail.gameType,
            players: [politePlayer]
        });
    });
});
