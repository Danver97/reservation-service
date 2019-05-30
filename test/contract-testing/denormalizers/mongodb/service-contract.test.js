const assert = require('assert');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const orderControl = require('../../../infrastructure/denormalizers/mongodb/orderControl')('testdb');
const writerFunc = require('../../../infrastructure/denormalizers/mongodb/writer');
const handlerFunc = require('../../../infrastructure/denormalizers/mongodb/handler');
const Interactor = require('../../contract-testing-utils').Interactor;


const interactor = new Interactor({
    consumer: 'reservation-mongodb-denormalizer',  // TODO: parametrize
    provider: 'reservation-service',
}, handler);

const mongod = new MongoMemoryServer();
let client = null;
let collection = null;
let writer = null;
let handler = null;

describe('MongoDB Denormalizer contract test', function () {
    this.slow(5000);
    this.timeout(10000);
    const restId = '24071e32-263f-45cc-81b9-f4acac75fb1d';
    const resId = '445f6ab3-8551-4285-bc0e-7e8d61e79827';
    const userId = '70f7d254-e8fa-4671-bb50-e7d181551149';
    const reservationName = 'Smith family'
    const people = 6;

    before(async function () {
        this.timeout(10000);
        const mongoConfig = {
            url: await mongod.getConnectionString(),
            db: 'Reservation',
            collection: 'Reservation',
        };
        client = new MongoClient(mongoConfig.url, { useNewUrlParser: true });
        await client.connect();
        collection = client.db(mongoConfig.db).collection(mongoConfig.collection);
        writer = await writerFunc(mongoConfig);
        handler = handlerFunc(writer, orderControl);
    });

    it('reservationCreated is handled properly', async () => {

        const state = 'a new reservation is created';
        const eventName = 'reservationCreated';
        const content = eventContent.reservationCreatedEvent(r);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            const doc = await collection.findOne({ restId, resId });
            assert.deepStrictEqual(doc, 1);
        });
    });

    it('reservationConfirmed is handled properly', async () => {

        const state = 'a reservation has been added to the restaurant reservations and it is now confirmed';
        const eventName = 'reservationConfirmed';
        const content = eventContent.reservationCreatedEvent(r);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            const doc = await collection.findOne({ restId, resId });
            assert.deepStrictEqual(doc, 1);
        });
    });

    it('reservationCancelled is handled properly', async () => {

        const state = 'a reservation has been added to the restaurant reservations but it is now cancelled';
        const eventName = 'reservationCancelled';
        const content = eventContent.reservationCreatedEvent(r);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            const doc = await collection.findOne({ restId, resId });
            assert.deepStrictEqual(doc, 1);
        });
    });

    it('restaurantReservationsCreated is handled properly', async () => {

        const state = 'a new restaurantReservations is created';
        const eventName = 'restaurantReservationsCreated';
        const content = eventContent.reservationCreatedEvent(r);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            const doc = await collection.findOne({ restId });
            assert.deepStrictEqual(doc, 1);
        });
    });

    it('reservationAdded is handled properly', async () => {

        const state = 'a reservation is added to the restaurant reservations';
        const eventName = 'reservationAdded';
        const content = eventContent.reservationCreatedEvent(r);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            const doc = await collection.findOne({ restId });
            assert.deepStrictEqual(doc, 1);
        });
    });

    it('reservationRemoved is handled properly', async () => {

        const state = 'a reservation is removed from the restaurant reservations';
        const eventName = 'reservationRemoved';
        const content = eventContent.reservationCreatedEvent(r);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            const doc = await collection.findOne({ restId });
            assert.deepStrictEqual(doc, 1);
        });
    });
});