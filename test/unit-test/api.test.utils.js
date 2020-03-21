const Event = require('@danver97/event-sourcing/event');
const TestEventBroker = require('@danver97/event-sourcing/eventBroker')['testbroker'];
const dMongoHandlerFunc = require('../../infrastructure/denormalizers/mongodb/handler');
const dMongoWriterFunc = require('../../infrastructure/denormalizers/mongodb/writer');
const dMongoOrderCtrlFunc = require('../../infrastructure/denormalizers/mongodb/orderControl');

const testbroker = new TestEventBroker({ eventBrokerName: 'testBroker' });

const orderControlTableName = 'DenormOrderControlTest';

const ordCtrlDB = process.env.TEST === 'integration' ? 'dynamodb' : 'testdb';
const endpoint = process.env.CLOUD === 'aws' ? undefined : 'http://localhost:4569';

const dMongoOrderCtrl = dMongoOrderCtrlFunc(ordCtrlDB, { tableName: orderControlTableName, endpoint });
let dMongoHandler;

async function setUpDenormalizer(mongoOptions) {
    const dMongoWriter = await dMongoWriterFunc(mongoOptions);
    dMongoHandler = await dMongoHandlerFunc(dMongoWriter, dMongoOrderCtrl); // handlersLogLevel

    await testbroker.subscribe('microservice-test');
    return dMongoHandler;
}

async function processEvents() {
    if (process.env.TEST === 'integration') {
        await waitAsync(processEventTime);
        return;
    }
    let events = await testbroker.getEvent({ number: 10 });
    if (Array.isArray(events)) {
        events = events.filter(e => e !== undefined);
        for (let e of events) {
            // console.log(e.message);
            let mongoEvent = Event.fromObject(e);
            mongoEvent.payload = Object.assign({}, e.payload);
            await dMongoHandler(mongoEvent, () => {});
            await testbroker.destroyEvent(e);
        }
    }
}

async function reset() {
    await dMongoOrderCtrl.db.reset();
}

module.exports = {
    setUpDenormalizer,
    processEvents,
    reset,
};
