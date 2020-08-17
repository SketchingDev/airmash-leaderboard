export interface Payload<T> {
    hasError: false;
    data: T,
}

export interface PayloadError {
    hasError: true;
    error: string;
}

export interface Player {
    name: string;
    level: number;
}

export interface PlayerLeaderboard {
    players: Player[];
    dateRange: { from: Date; to: Date };
}

export interface PlayerMetricsNotFound {
    playerFound: false;
}

export interface PlayerMetricsFound {
    playerFound: true;
    metrics: {
        name: string;
        level: number;
        lastSeenOnline: string;
        daysSeenOnline: string[];
        planeSeenTheMost: 'predator' | 'goliath' | 'copter' | 'tornado' | 'prowler' | undefined;
    }
}

export type PlayerMetrics = PlayerMetricsFound | PlayerMetricsNotFound;

export class ApiClient {
    private static readonly LEADERBOARD_PATH = "leaderboard";
    private static readonly PLAYER_PATH = "player";

    constructor(private readonly baseUri: string) {
    }

    public leaderboard(): Promise<Payload<PlayerLeaderboard> | PayloadError> {
        const url = `${this.baseUri}/${ApiClient.LEADERBOARD_PATH}`;
        return fetch(url).then(res => res.json());
    }

    public playerMetrics(playerName: string): Promise<Payload<PlayerMetrics> | PayloadError> {
        const url = `${this.baseUri}/${ApiClient.PLAYER_PATH}/${encodeURIComponent(playerName)}`;
        return fetch(url).then(res => res.json());
    }
}
