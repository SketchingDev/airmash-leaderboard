import {DynamoDB} from "aws-sdk";
import {GameSnapshotRepository} from "./GameSnapshotRepository";
import {addWeeks, getUnixTime} from "date-fns";

const { Table, Entity } = require('dynamodb-toolbox');

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

export class DynamoDbGameSnapshotRepository implements GameSnapshotRepository {

    private static ttlInWeeks = 2;

    private static createTable(documentClient: DynamoDB.DocumentClient, tableName: string) {
        return new Table({
            name: tableName,
            partitionKey: 'playerName',
            sortKey: 'snapshotTimestamp',
            DocumentClient: documentClient,
            attributes: {
                playerName: 'string',
                snapshotTimestamp: 'string',
                week: 'string',
                level: 'number',
            },
            indexes: {
                leaderboardGSI: {partitionKey: 'week', sortKey: 'level'}
            }
        });
    }

    private static createPlayerSnapshotEntity(table: any, ttlInWeeks: number): any {
        const generateFortnightTtl = () => getUnixTime(addWeeks(Date.now(), ttlInWeeks));
        return new Entity({
            name: 'PlayerSnapshot',
            attributes: {
                playerName: {type: 'string', partitionKey: true},
                snapshotTimestamp: {type: 'string', sortKey: true}, // default: () => new Date().toISOString()
                week: {type: 'string'},
                level: {type: 'number'},
                airplaneType: {type: 'string'},
                timeToLive: {type: 'string', default: generateFortnightTtl}
            },
            table
        });
    }
    private static createLeaderboardEntity(table: any): any {
        return new Entity({
            name: 'Leaderboard',
            table,
            attributes: {
                playerName: {type: 'string', partitionKey: true},
                snapshotTimestamp: {type: 'string', sortKey: true},
                week: {type: 'string', partitionKey: 'leaderboardGSI'},
                level: {type: 'number', sortKey: 'leaderboardGSI'},
            }
        });
    }

    private readonly table: any;
    private readonly playerSnapshotEntity: any;
    private readonly leaderboardEntity: any;

    constructor(documentClient: DynamoDB.DocumentClient, tableName: string) {
        this.table = DynamoDbGameSnapshotRepository.createTable(documentClient, tableName);
        this.playerSnapshotEntity = DynamoDbGameSnapshotRepository.createPlayerSnapshotEntity(this.table, DynamoDbGameSnapshotRepository.ttlInWeeks);
        this.leaderboardEntity = DynamoDbGameSnapshotRepository.createLeaderboardEntity(this.table);
    }

    public async saveSnapshot(snapshot: PlayerSnapshot): Promise<void> {
        await this.playerSnapshotEntity.put(snapshot);
    }

    /**
     * The time span of the snapshots depends on the time-to-live value set against the snapshot
     * when it was saved.
     */
    public async findPlayerLevelsByWeek(week: number, minLevel = 2): Promise<PlayerLevelSnapshotItem[]> {
        const entities = await this.leaderboardEntity.query(`${week}`, {
            gte: minLevel,
            // reverse: true, // return items in descending order (newest first)
            // capacity: 'indexes', // return the total capacity consumed by the indexes
            index: 'leaderboardGSI',
        });

        return entities.Items;
    }
}
