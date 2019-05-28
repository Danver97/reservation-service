const Event = require('@danver97/event-sourcing/event');

const handlerFunc = require('./handler');
const orderControlFunc = require('./orderControl');
const writerFunc = require('./writer');

const orderCtrlDb = process.env.ORDER_CONTROL_DB;
const writerOptions = {
    url: process.env.MONGODB_URL,
    db: process.env.MONGODB_DB,
    collection: process.env.MONGODB_COLLECTION,
};
const writer = writerFunc(writerOptions);

const orderControl = orderControlFunc(orderCtrlDb);

const handler = handlerFunc(writer, orderControl);

exports.mongoDenormalizer = async function(event) {
    const messages = event.Records.map(e => Event.fromObject(JSON.parse(e.body)));
    const promises = [];
    for (let m of messages) {
        promises.push(handler(m));
    }
    await Promise.all(promises);
}