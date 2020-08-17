import {GameSnapshotRepository, PlayerLevelSnapshotItem} from "../../../storage/GameSnapshotRepository";
import {endOfWeek, getWeek, startOfWeek, subWeeks} from "date-fns";

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
    dateRange: {from: Date; to: Date};
}

export type Leaderboard = () => Promise<FullLeaderboard>;

export const leaderboard = (deps: LeaderboardDependencies): Leaderboard =>
    async (): Promise<FullLeaderboard> => {
        const dateRange = {
            from: startOfWeek(subWeeks(deps.getNow(), 1)),
            to: endOfWeek(deps.getNow())
        }

        const snapshots: PlayerLevelSnapshotItem[] = [];
        try {

            snapshots.push(...await deps.gameSnapshotRepository.findPlayerLevelsByWeek(getWeek(dateRange.from), deps.minAccountLevel));
        } catch (error) {
            console.warn("Failed to get this week's snapshots", {error: error.message});
        }
        try {

            snapshots.push(...await deps.gameSnapshotRepository.findPlayerLevelsByWeek(getWeek(dateRange.to), deps.minAccountLevel));
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
            dateRange,
            players: playersWithLevelOrdered.map(([name, level]) => ({
                name,
                level
            }))
        };
    };
