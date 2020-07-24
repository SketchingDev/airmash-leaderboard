import {PlayerLeaderboard} from "./PlayerLeaderboard";
import {GamePlayerCount} from "./GamePlayerCount";

export interface Payload<T> {
    hasError: false;
    data: T,
}

export interface PayloadError {
    hasError: true;
    error: string;
}

export class LeaderboardApiClient {
    private static readonly GAME_LEADERBOARD_PATH = "leaderboard";
    private static readonly GAME_PLAYER_COUNT_TIMELINE_PATH = "players/count";
    private static readonly LEADERBOARD_PATH = "leaderboard";

    constructor(private readonly baseUri: string) {
    }

    public leaderboard(gameUrl: string| null): Promise<Payload<PlayerLeaderboard> | PayloadError> {
        let url: string;
        if (!gameUrl) {
            url = `${this.baseUri}/${LeaderboardApiClient.LEADERBOARD_PATH}`;
        } else {
            url =`${this.baseUri}/game/${encodeURIComponent(gameUrl)}/${LeaderboardApiClient.GAME_LEADERBOARD_PATH}`;
        }
        return fetch(url).then(res => res.json())
    }

    public playerCountTimeline(gameUrl: string): Promise<Payload<GamePlayerCount> | PayloadError> {
        const url = `${this.baseUri}/game/${encodeURIComponent(gameUrl)}/${LeaderboardApiClient.GAME_PLAYER_COUNT_TIMELINE_PATH}`;
        return fetch(url).then(res => res.json())
    }
}
