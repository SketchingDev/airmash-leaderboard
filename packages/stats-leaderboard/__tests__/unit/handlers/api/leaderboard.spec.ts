import {leaderboard, LeaderboardDependencies} from "../../../../src/handlers/api/leaderboard";
import {GameSnapshotRepository} from "../../../../src/storage/GameSnapshotRepository";
import {PlayerLevelSnapshotItem} from "../../../../src/storage/DynamoDbGameSnapshotRepository";

describe("Leaderboard", () => {
    test("Returns players from one call even if the other fails", async () => {
        const player: PlayerLevelSnapshotItem = {
            level: 0,
            playerName: "test-player",
            snapshotTimestamp: "",
            week: 0
        }

        const gameSnapshotRepository: jest.Mocked<GameSnapshotRepository> = {
            findPlayerLevelsByWeek: jest.fn()
                .mockResolvedValueOnce([player])
                .mockRejectedValueOnce(new Error("test-error-message")),
            saveSnapshot: jest.fn()
        }

        const deps: LeaderboardDependencies = {
            gameSnapshotRepository,
            leaderboardSize: 10,
            minAccountLevel: 0,
            getNow: () => new Date()
        }

        expect(await leaderboard(deps)()).toStrictEqual({
            players: [
                {
                    name: "test-player",
                    level: 0
                }
            ]
        });
    });

    test("Returns players from both calls", async () => {
        const player1: PlayerLevelSnapshotItem = {
            level: 0,
            playerName: "test-player-1",
            snapshotTimestamp: "",
            week: 0
        }
        const player2: PlayerLevelSnapshotItem = {
            level: 0,
            playerName: "test-player-2",
            snapshotTimestamp: "",
            week: 0
        }

        const gameSnapshotRepository: jest.Mocked<GameSnapshotRepository> = {
            findPlayerLevelsByWeek: jest.fn()
                .mockResolvedValueOnce([player1])
                .mockResolvedValueOnce([player2]),
            saveSnapshot: jest.fn()
        }

        const deps: LeaderboardDependencies = {
            gameSnapshotRepository,
            leaderboardSize: 10,
            minAccountLevel: 0,
            getNow: () => new Date()
        }

        expect(await leaderboard(deps)()).toStrictEqual(
            {
                players: [
                    {
                        name: "test-player-1",
                        level: 0
                    },
                    {
                        name: "test-player-2",
                        level: 0
                    }
                ]
            }
        );
    });
});
