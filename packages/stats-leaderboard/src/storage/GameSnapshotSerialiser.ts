import {GameSnapshot, Player} from "./GameSnapshotRepository";
import {DynamoDB} from "aws-sdk";
import {URL} from "url";

interface DynamoDbRecord extends DynamoDB.Types.AttributeMap {
    Timestamp: {
        N: string;
    },
    Type: {
        S: string;
    },
    Url: {
        S: string;
    },
    Players: {
        M: {
            [playerName: string]: {
                M: {
                    accountLevel: { N: string };
                    airplaneType: { S: string | undefined },
                }
            }
        }
    },
}

export const GameSnapshotSerialiser = {
    serialise(snapshot: GameSnapshot): DynamoDbRecord {
        const serialisePlayers = (game: GameSnapshot): DynamoDbRecord["Players"] => {
            const map: DynamoDbRecord["Players"]["M"] = {};

            for (const p of game.players) {
                map[p.name] = {
                    M: {
                        accountLevel: {N: p.accountLevel?.toString() || "0"},
                        airplaneType: {S: p.airplaneType?.toString() || undefined},
                    }
                }
            }

            return {M: map}
        }

        return {
            Url: {S: snapshot.url.toString()},
            Timestamp: {N: snapshot.timestamp.getTime().toString()},
            Type: {S: snapshot.gameType.toString()}, // TODO This doesn't need to be saved
            Players: serialisePlayers(snapshot)
        };
    },

    deserialise(record: DynamoDB.Types.AttributeMap): GameSnapshot {
        const deserialisePlayers = (players: { M?: DynamoDB.Types.MapAttributeValue }): Player[] => {
            const abcPlayers: Player[] = [];

            for (const [name, {M}] of Object.entries(players.M || {})) {
                const airplaneType = M?.airplaneType?.S;
                const accountLevel = M?.accountLevel?.N;

                abcPlayers.push({
                    name,
                    // @ts-ignore
                    airplaneType: airplaneType || undefined,
                    accountLevel: accountLevel ? Number.parseInt(accountLevel) : 0
                })
            }

            return abcPlayers;
        }

        return {
            url: new URL(record.Url.S || ""),
            timestamp: new Date(Number.parseInt(record.Timestamp.N || "0")),
            gameType: record.Type.S as any,
            players: deserialisePlayers(record.Players || {})
        }
    }
}
