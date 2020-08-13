import {GameSnapshotRepository} from "../../storage/GameSnapshotRepository";
import {getWeek, subWeeks} from "date-fns";
import {PlayerLevelSnapshotItem} from "../../storage/DynamoDbGameSnapshotRepository";

export interface LeaderboardDependencies {
    gameSnapshotRepository: GameSnapshotRepository;
    leaderboardSize: number;
    minAccountLevel: number;
    getNow: () => Date;
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
        const snapshots: PlayerLevelSnapshotItem[] = [];
        try {
            const thisWeek = getWeek(deps.getNow());
            snapshots.push(...await deps.gameSnapshotRepository.findPlayerLevelsByWeek(thisWeek, deps.minAccountLevel));
        } catch (error) {
            console.warn("Failed to get this week's snapshots", {error: error.message});
        }
        try {
            const lastWeek = getWeek(subWeeks(deps.getNow(), 1));
            snapshots.push(...await deps.gameSnapshotRepository.findPlayerLevelsByWeek(lastWeek, deps.minAccountLevel));
        } catch (error) {
            console.warn("Failed to get last week's snapshots", {error: error.message});
        }

        const players = new Map<string, number>();
        for (const snapshot of snapshots) {
            const level = players.get(snapshot.playerName);
            if (level === undefined || snapshot.level > level) {
                players.set(snapshot.playerName, snapshot.level);
            }
        }

        const playersWithLevelOrdered = Array.from(players)
            .sort(([, levelOne], [, levelTwo]) => levelTwo - levelOne)
            .slice(0, deps.leaderboardSize);

        return {
            players: playersWithLevelOrdered.map(([name, level]) => ({
                name,
                level
            }))
        };
    };
