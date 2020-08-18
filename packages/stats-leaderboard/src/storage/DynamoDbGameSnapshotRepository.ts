import {DynamoDB} from "aws-sdk";
import {GameSnapshotRepository, PlayerLevelSnapshotItem, PlayerSnapshot} from "./GameSnapshotRepository";
import {addWeeks, getUnixTime} from "date-fns";

const { Table, Entity } = require('dynamodb-toolbox');

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
                snapshotTimestamp: {type: 'string', sortKey: true},
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
        await this.playerSnapshotEntity.put({
            ...snapshot,
            snapshotTimestamp: snapshot.snapshotTimestamp.toISOString()
        });
    }

    /**
     * The time span of the snapshots depends on the time-to-live value set against the snapshot
     * when it was saved.
     */
    public async findPlayerLevelsByWeek(week: number, minLevel = 2): Promise<PlayerLevelSnapshotItem[]> {
        const entities = await this.leaderboardEntity.query(`${week}`, {
            gte: minLevel,
            index: 'leaderboardGSI',
        });

        return entities.Items.map((item: any) => ({
            ...item,
            snapshotTimestamp: new Date(item.snapshotTimestamp)
        }));
    }

    public async findPlayerSnapshotsByName(playerName: string): Promise<PlayerSnapshot[]> {
        const entities = await this.playerSnapshotEntity.query(playerName);
        return entities.Items.map((item: any) => ({
            ...item,
            snapshotTimestamp: new Date(item.snapshotTimestamp)
        }));
    }
}
