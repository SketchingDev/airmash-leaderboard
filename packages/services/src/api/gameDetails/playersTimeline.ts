import {URL} from "url";
import {GameSnapshotRepository} from "../../storage/GameSnapshotRepository";
import {subDays} from "date-fns";

export interface PlayersTimelineDependencies {
    gameSnapshotRepository: GameSnapshotRepository;
    timespanInDays: number;
}

export interface GamePlayerCount {
    url: URL | string;
    playersTimeline: {
        timestamp: Date;
        totalRealPlayers: number;
    }[];
}

export type PlayersTimeline = (parameters: {[p: string]: string}) => Promise<GamePlayerCount>;

export const playersTimeline = (deps: PlayersTimelineDependencies): PlayersTimeline =>
    async (parameters): Promise<GamePlayerCount> => {
        if (!parameters["url"]) {
            throw new Error("URL parameter is not defined");
        }
        const url = new URL(decodeURIComponent(parameters["url"]));

        const now = new Date();
        const dateRange = { to: now, from: subDays(now, deps.timespanInDays)};

        const snapshots = await deps.gameSnapshotRepository.findByDateRange(url, dateRange);

        return {
            url,
            playersTimeline: snapshots.map(s => ({
                timestamp: s.timestamp,
                totalRealPlayers: s.players.length
            }))
        };
    };
