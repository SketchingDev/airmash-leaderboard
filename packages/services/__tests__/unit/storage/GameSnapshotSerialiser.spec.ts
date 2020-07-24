import {GameSnapshotSerialiser} from "../../../src/storage/GameSnapshotSerialiser";
import {URL} from "url";
import {GameType} from "../../../src/airmash/GameType";
import {AirplaneType} from "../../../src/airmash/AirplaneType";

test("serialisation", () => {
    const record = GameSnapshotSerialiser.serialise({
        url: new URL("wss://test-server.test/ffa"),
        gameType: GameType.BattleRoyale,
        timestamp: new Date("2020-06-06T22:34:22.792Z"),
        players: [
            {
                name: "test",
                airplaneType: AirplaneType.Prowler,
                accountLevel: 1,
            }
        ]
    });

    expect(record).toStrictEqual({
        Players: {
            M: {
                "test": {
                    M: {
                        accountLevel: {N: "1"},
                        airplaneType: {S: "prowler"}
                    }
                }
            },
        },
        Timestamp: {
            N: "1591482862792"
        },
        Type: {
            S: "battle-royale"
        },
        Url: {
            S: "wss://test-server.test/ffa"
        }

    });
});

test("deserialisation", () => {
    const record = GameSnapshotSerialiser.deserialise({
        Players: {
            M: {
                "test2": {
                    M: {
                        accountLevel: {N: "50"},
                        airplaneType: {S: "tornado"}
                    }
                }
            },
        },
        Timestamp: {
            N: "1594074862792"
        },
        Type: {
            S: "free-for-all"
        },
        Url: {
            S: "wss://test-server.test/ffa2"
        }
    });

    expect(record).toStrictEqual({
        url: new URL("wss://test-server.test/ffa2"),
        timestamp: new Date("2020-07-06T22:34:22.792Z"),
        players: [
            {
                name: "test2",
                airplaneType: AirplaneType.Tornado,
                accountLevel: 50,
            }

        ],
        gameType: GameType.FreeForAll
    });
});
