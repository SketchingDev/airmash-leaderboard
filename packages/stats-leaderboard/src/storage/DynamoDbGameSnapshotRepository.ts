import {DynamoDB} from "aws-sdk";
import {GameSnapshot, GameSnapshotRepository} from "./GameSnapshotRepository";
import {URL} from "url";
import {GameSnapshotSerialiser} from "./GameSnapshotSerialiser";

export class DynamoDbGameSnapshotRepository implements GameSnapshotRepository {
    constructor(private readonly dynamoDb: DynamoDB,
                private readonly tableName: string,
                private readonly serializer = GameSnapshotSerialiser) {
    }

    public async saveAll(games: GameSnapshot[]): Promise<void> {
        if (games.length === 0) {
            return;
        }

        const params: DynamoDB.Types.BatchWriteItemInput = {RequestItems: {}};
        params.RequestItems[this.tableName] = games.map(g => ({
            PutRequest: {
                Item: this.serializer.serialise(g)
            }
        }));

        await this.dynamoDb.batchWriteItem(params).promise();
    }

    public async findByDateRange(url: URL | string, range: { from: Date; to: Date }): Promise<GameSnapshot[]> {
        const params: DynamoDB.Types.QueryInput = {
            TableName: this.tableName,
            ExpressionAttributeValues: {
                ':url': {S: url.toString()},
                ':timestampFrom': { N: range.from.getTime().toString() },
                ':timestampTo': {N: range.to.getTime().toString()}
            },
            KeyConditionExpression: '#url = :url and #timestamp between :timestampFrom and :timestampTo',
            ExpressionAttributeNames: {
                "#url": "Url",
                "#timestamp": "Timestamp",
            },
        };

        const {Items} = await this.dynamoDb.query(params).promise();
        return Items?.map(i => this.serializer.deserialise(i)) || [];
    }
}
