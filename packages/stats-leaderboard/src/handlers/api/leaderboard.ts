import {GameSnapshotRepository} from "../../storage/GameSnapshotRepository";

export interface LeaderboardDependencies {
    gameSnapshotRepository: GameSnapshotRepository;
    leaderboardSize: number;
    minAccountLevel: number;
    getCurrentWeek: () => number;
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
        // TODO Two weeks worth of data
        const snapshots = await deps.gameSnapshotRepository.findPlayerLevelsByWeek(deps.getCurrentWeek());

        const players = new Map<string, number>();
        for (const snapshot of snapshots) {
            const level = players.get(snapshot.playerName);
            if (level === undefined || snapshot.level > level) {
                players.set(snapshot.playerName, snapshot.level);
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
