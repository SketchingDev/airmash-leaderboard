export interface GamePlayerCount {
    url: string;
    playersTimeline: {
        timestamp: string;
        totalRealPlayers: number;
    }[];
}
