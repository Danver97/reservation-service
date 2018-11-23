const AWS = require('aws-sdk/global');
const DynamoDb = require('aws-sdk/clients/dynamodb');
const DynamoDataTypes = require('dynamodb-data-types');
const ddbConfig = require('../../../lib/AWS').ddb;

const Promisify = require('../../../lib/utils').promisify;

const dynamoAttr = DynamoDataTypes.AttributeValue;

/* const dbparams = { apiVersion: '2012-08-10' };
if (ENV.event_store === 'dynamodb' && ENV.dburl)
    dbparams.endpoint = new AWS.Endpoint(ENV.dburl); 
const dynamoDb = new DynamoDb(dbparams); */

let dynamoDb = ddbConfig.ddb;

if (process.env.NODE_ENV === 'test_event_sourcing') {
    console.log('DynamoDb: test_event_sourcing');
    const dbparams = { apiVersion: '2012-08-10' };
    dbparams.endpoint = new AWS.Endpoint(process.env.DB_URL);
    dynamoDb = new DynamoDb(dbparams);
    init(process.env.MICROSERVICE_NAME);
}

async function init(microserviceName) {
    console.log('DynamoDb: init');
    if (!microserviceName)
        throw new Error('DynamoDb: microservice name not specified on initialization.');
    const tableName = `${microserviceName}EventStreamTable`;
    const tableParams = {
        AttributeDefinitions: [
            {
                AttributeName: 'StreamId',
                AttributeType: 'S',
            },
            {
                AttributeName: 'EventId',
                AttributeType: 'N',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'StreamId',
                KeyType: 'HASH',
            },
            {
                AttributeName: 'EventId',
                KeyType: 'RANGE',
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
        TableName: tableName,
        StreamSpecification: {
            StreamEnabled: true,
            StreamViewType: 'NEW_IMAGE', // 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY',
        },
    };
    try {
        await dynamoDb.createTable(tableParams).promise();
    } catch (e) {
        if (e.code === 'ResourceInUseException')
            console.log('DynamoDb table already created.');
        else {
            console.log(e);
            throw e;
        }
    }
}

function removeEmptySetsOrStrings(attrValues) {
    Object.keys(attrValues).forEach(k => {
        if (typeof attrValues[k] !== 'object')
            return;
        if (attrValues[k].S !== undefined && attrValues[k].S === '')
            delete attrValues[k];
        if (attrValues[k].NS && attrValues[k].NS.length === 0)
            delete attrValues[k];
        if (attrValues[k] && attrValues[k].M)
            removeEmptySetsOrStrings(attrValues[k].M);
    });
}

function save(streamId, eventId, message, payload, cb) {
    return Promisify(async () => {
        let eId = eventId || payload._revisionId || 0;
        eId++;
        delete payload._revisionId;
        const attrValues = dynamoAttr.wrap({
            ':sid': streamId,
            ':eid': eId, /* 1 */ // OCCHIO QUIIIII!
            ':message': message,
            ':payload': payload,
        });
        removeEmptySetsOrStrings(attrValues);
        const params = {
            TableName: 'restaurant_catalogEventStreamTable', // restaurantEvents.topic,
            Key: dynamoAttr.wrap({ StreamId: streamId, EventId: eId /* 1 */ }), // OCCHIO QUIIIII!
            ExpressionAttributeNames: {
                '#SID': 'StreamId',
                '#EID': 'EventId',
                '#MSG': 'Message',
                '#PL': 'Payload',
            },
            ExpressionAttributeValues: attrValues,
            UpdateExpression: 'SET #MSG = :message, #PL = :payload',
            ConditionExpression: '#SID <> :sid AND #EID <> :eid', // 'attribute_not_exists(StreamId) AND attribute_not_exists(EventId)',
            ReturnValues: 'ALL_NEW',
            ReturnItemCollectionMetrics: 'SIZE',
            ReturnConsumedCapacity: 'INDEXES',
        };
        // console.log(JSON.stringify(params.ExpressionAttributeValues));
        await dynamoDb.updateItem(params).promise();
    }, cb);
}

function getStream(streamId, cb) {
    return Promisify(async () => {
        const params = {
            ConsistentRead: true,
            ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': streamId, ':start': 0, ':now': Number.MAX_SAFE_INTEGER }),
            KeyConditionExpression: 'StreamId = :streamId AND EventId BETWEEN :start AND :now',
            TableName: 'restaurant_catalogEventStreamTable',
        };
        const reply = await dynamoDb.query(params).promise();
        const results = reply.Items.map(i => dynamoAttr.unwrap(i));
        return results;
    }, cb);
}

module.exports = {
    dynamoDb,
    save,
    getStream,
};
