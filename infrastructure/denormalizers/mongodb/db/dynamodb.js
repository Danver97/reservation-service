const Endpoint = require('aws-sdk/global').Endpoint;
const DDB = require('aws-sdk/clients/dynamodb');
const ddbDataTypes = require('dynamodb-data-types').AttributeValue;

// const dynamodb = new DDB({apiVersion: '2012-08-10'});

function wrap(data) {
    return ddbDataTypes.wrap(data);
}
function unwrap(data) {
    return ddbDataTypes.unwrap(data);
}

class DynamoOrderControlDb {
    constructor(tableName, endpoint) {
        if (!tableName) {
            throw new Error(
                `OrderControlError: missing the following parameters in the export function ${tableName ? '' : 'tableName'}`
            );
        }
        const ddbOptions = { apiVersion: '2012-08-10' };
        if (endpoint)
            ddbOptions.endpoint = new Endpoint(endpoint);
        this.dynamodb = new DDB(ddbOptions);
        this.tableName = tableName;
    }

    async getOne(streamId) {
        const params = {
            Key: {
                StreamId: wrap(streamId),
            },
            TableName: this.tableName,
            ConsistentRead: true,
        };
        const response = await this.dynamodb.getItem(params).promise();
        const item = unwrap(response.Item);
        return item;
    }

    async getMultiple(streamIds) {
        const keys = streamIds.map(sId => ({ StreamId: wrap(sId) }));
        const params = {
            RequestItems: {
                [this.tableName]: {
                    Keys: keys,
                    ConsistentRead: true,
                },
            },
        };
        const response = await this.dynamodb.batchGetItem(params).promise();
        const items = response.Responses[this.tableName].map(elem => unwrap(elem));
        return items;
    }

    updateOne(streamId, lastEventId, newEventId) {
        const params = {
            ExpressionAttributeNames: {
                "#LPEI": "LastProcessedEventId",
            },
            ExpressionAttributeValues: {
                ":lpei": wrap(lastEventId),
                ":npei": wrap(newEventId || lastEventId + 1),
            },
            Key: {
                StreamId: wrap(streamId),
            },
            ReturnValues: "ALL_NEW",
            TableName: this.tableName,
            ConditionExpression: '#LPEI = :lpei',
            UpdateExpression: "SET #LPEI = :npei",
        };
        return this.dynamodb.updateItem(params).promise();
    }

    updateMultiple(updates) {
        if (Array.isArray(updates)) {
            const promises = updates.map(e => updateLastProcessedEvent(e.streamId, e.last, e.new));
            return Promise.all(promises);
        }
        if (typeof updates === 'object') {
            const promises = Object.keys(updates).map(k => updateLastProcessedEvent(k, updates[k].last, updates[k].new));
            return Promise.all(promises);
        }
    }

    async reset() {
        //TODO
    }
}

let db = new DynamoOrderControlDb(process.env.ORDER_CONTROL_TABLE, process.env.ORDER_CONTROL_DB_URL);

module.exports = function (options) {
    if (options) { 
        if (options.fromEnv)
            db = new DynamoOrderControlDb(process.env.ORDER_CONTROL_TABLE, process.env.ORDER_CONTROL_DB_URL);
        else
            db = new DynamoOrderControlDb(options.tableName, options.endpoint);
    }
    return db;
}
