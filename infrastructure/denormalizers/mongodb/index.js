const Event = require('@danver97/event-sourcing/event');
var attr = require('dynamodb-data-types').AttributeValue;
const AWS = require('aws-sdk/global');

AWS.config.update({region: 'eu-west-2'});

const handlerFunc = require('./handler');
const orderControlFunc = require('./orderControl');
const writerFunc = require('./writer');

const orderCtrlDb = process.env.ORDER_CONTROL_DB;
const writerOptions = {
    url: process.env.MONGODB_URL,
    db: process.env.MONGODB_DB,
    collection: process.env.MONGODB_COLLECTION,
};

let writer, orderControl, handler;

async function init() {
    writer = await writerFunc(writerOptions);
    orderControl = orderControlFunc(orderCtrlDb);
    handler = handlerFunc(writer, orderControl);
}

exports.mongoDenormalizer = async function(event) {
    console.log('mongoDenormalizer');
    if (!writer || !orderControl || !handler)
        await init();
    const messages = event.Records.map(r => {
        const body = JSON.parse(r.body);
        const event = JSON.parse(body.Message);
        delete event.SequenceNumber;
        return Event.fromObject(attr.unwrap(event))
    });
    const promises = [];
    for (let m of messages) {
        promises.push(handler(m));
    }
    await Promise.all(promises);
}