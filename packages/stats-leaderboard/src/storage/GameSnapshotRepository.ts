/** Snapshot of a player in time */
export interface PlayerSnapshot {
    playerName: string;
    snapshotTimestamp: string; // TODO (De)Serialise
    week: number;
    level: number;
    airplaneType: 'predator' | 'goliath' | 'copter' | 'tornado' | 'prowler';
}

/**
 * Snapshot focused on player levels
 */
export interface PlayerLevelSnapshotItem {
    playerName: string;
    snapshotTimestamp: string;
    week: number;
    level: number;
}

export interface GameSnapshotRepository {
    saveSnapshot(snapshot: PlayerSnapshot): Promise<void>;
    findPlayerLevelsByWeek(week:number, minLevel?: number): Promise<PlayerLevelSnapshotItem[]>;
    findPlayerSnapshotsByName(playerName:string): Promise<PlayerSnapshot[]>;
}
