import {GameSnapshot, GameSnapshotRepository} from "../../storage/GameSnapshotRepository";
import {GameUrl} from "../../airmash/GameUrl";
import {subDays} from "date-fns";

export interface LeaderboardDependencies {
    gameSnapshotRepository: GameSnapshotRepository;
    leaderboardSize: number;
    minAccountLevel: number;
    timespanInDays: number;
    gameDataLoader: () => Promise<GameUrl[]>;
}

interface Player {
    name: string;
    level: number;
}

interface FullLeaderboard {
    players: Player[];
}

export type Leaderboard = () => Promise<FullLeaderboard>;

export const leaderboard = (deps: LeaderboardDependencies): Leaderboard =>
    async (): Promise<FullLeaderboard> => {
        const now = new Date();
        const dateRange = { to: now, from: subDays(now, deps.timespanInDays)};

        const gameUrls = await deps.gameDataLoader();
        const snapshots: GameSnapshot[] = [];

        for (const {url} of gameUrls) {
            const gameSnapshots = await deps.gameSnapshotRepository.findByDateRange(url, dateRange);
            snapshots.push(...gameSnapshots);
        }

        const players = new Map<string, number>();
        for (const snapshot of snapshots) {
            for (const player of snapshot.players) {
                if (player.accountLevel === undefined) {
                    continue;
                }

                const level = players.get(player.name);
                if (level === undefined) {
                    players.set(player.name, player.accountLevel);
                } else if (player.accountLevel > level) {
                    players.set(player.name, player.accountLevel);
                }
            }
        }

        const playersWithLevelOrdered = Array.from(players)
            .filter(([, level]) => level >= deps.minAccountLevel)
            .sort(([, levelOne], [, levelTwo]) => levelTwo - levelOne)
            .slice(0, deps.leaderboardSize);

        return {
            players: playersWithLevelOrdered.map(([name, level]) => ({
                name,
                level
            }))
        };
    };
