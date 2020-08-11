import {PlayerLevelSnapshotItem, PlayerSnapshot} from "./DynamoDbGameSnapshotRepository";

export interface GameSnapshotRepository {
    saveSnapshot(snapshot: PlayerSnapshot): Promise<void>;
    findPlayerLevelsByWeek(week:number, minLevel?: number): Promise<PlayerLevelSnapshotItem[]>;
}
