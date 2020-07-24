import {URL} from "url";
import {GameType} from "../airmash/GameType";
import {AirplaneType} from "../airmash/AirplaneType";

export interface Player {
    name: string;
    accountLevel?: number;
    airplaneType?: AirplaneType;
}

/**
 * Temporal snapshot of the state of a game server
 */
export interface GameSnapshot {
    url: URL | string;
    timestamp: Date;
    gameType: GameType;
    players: Player[];
}

export interface GameSnapshotRepository {
    saveAll(snapshots: GameSnapshot[]): Promise<void>;
    findByDateRange(url: URL | string, range: { from: Date, to: Date }): Promise<GameSnapshot[]>;
}
