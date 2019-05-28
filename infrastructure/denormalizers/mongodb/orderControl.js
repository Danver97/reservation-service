const DDB = require('aws-sdk');
const ddbDataTypes = require('dynamodb-data-types').AttributeValue;

const dynamodb = new DDB({apiVersion: '2012-08-10'});
let tableName;

function wrap(data) {
    return ddbDataTypes.wrap(data);
}
function unwrap(data) {
    return ddbDataTypes.unwrap(data);
}

async function getLastProcessedEvent(streamId) {
    const params = {
        Key: {
            StreamId: wrap(streamId),
        },
        TableName: tableName,
        ConsistentRead: true,
    };
    const response = await dynamodb.getItem(params).promise();
    const item = unwrap(response.Item);
    return item;
}

async function getLastProcessedEvents(streamIds) {
    const keys = streamIds.map(sId => ({ StreamId: wrap(sId) }));
    const params = {
        RequestItems: {
            [tableName]: {
                Keys: keys,
                ConsistentRead: true,
            },
        },
    };
    const response = await dynamodb.batchGetItem(params).promise();
    const items = response.Responses[tableName].map(elem => unwrap(elem));
    return items;
}

function updateLastProcessedEvent(streamId, lastProcessedEventId, newProcessedEventId) {
    const params = {
        ExpressionAttributeNames: {
         "#LPEI": "LastProcessedEventId",
        },
        ExpressionAttributeValues: {
         ":lpei": wrap(lastProcessedEventId),
         ":npei": wrap(newProcessedEventId || lastProcessedEventId + 1),
        },
        Key: {
            StreamId: wrap(streamId),
        },
        ReturnValues: "ALL_NEW",
        TableName: tableName,
        ConditionExpression: '#LPEI = :lpei',
        UpdateExpression: "SET #LPEI = :npei",
       };
    return dynamodb.updateItem(params).promise();
}

function updateLastProcessedEvents(eventIds) {
    if (Array.isArray(eventIds)) {
        const promises = eventIds.map(e => updateLastProcessedEvent(e.streamId, e.last, e.new));
        return Promise.all(promises);
    }
    if (typeof eventIds === 'object') {
        const promises = Object.keys(eventIds).map(k => updateLastProcessedEvent(k, eventIds[k].last, eventIds[k].new));
        return Promise.all(promises);
    }
}

const exportObj = {
    getLastProcessedEvent,
    getLastProcessedEvents,
    updateLastProcessedEvent,
    updateLastProcessedEvents,
};

function exportFunc(table) {
    if (!table) {
        throw new Error(
            `OrderControlError: missing the following parameters in the export function ${table ? '' : 'table'}`
        );
    }
    tableName = table;
    return exportObj;
}

module.exports = exportFunc;
