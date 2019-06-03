const assert = require('assert');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const Reservation = require('../../../../domain/models/reservation');
const RestaurantReservations = require('../../../../domain/models/restaurantReservations');
const orderControl = require('../../../../infrastructure/denormalizers/mongodb/orderControl')('testdb');
const writerFunc = require('../../../../infrastructure/denormalizers/mongodb/writer');
const handlerFunc = require('../../../../infrastructure/denormalizers/mongodb/handler');
const Interactor = require('../../contract-testing-utils').Interactor;
const testUtils = require('../../../test-utils');
const eventContent = require('./eventContent');

const mongod = new MongoMemoryServer();
let client = null;
let collection = null;
let writer = null;
let handler = null;
let interactor = null;

async function repoReset() {
    await collection.deleteMany({});
    await orderControl.db.reset();
}

describe('MongoDB Denormalizer contract test', function () {
    this.slow(5000);
    this.timeout(10000);
    let eventId = 1;
    const restId = '24071e32-263f-45cc-81b9-f4acac75fb1d';
    const resId = '445f6ab3-8551-4285-bc0e-7e8d61e79827';
    const userId = '70f7d254-e8fa-4671-bb50-e7d181551149';
    const reservationName = 'Smith family'
    const people = 6;
    let rr = new RestaurantReservations(restId, testUtils.timeTable, testUtils.getTables(restId));

    const date = new Date('2040/08/15'); // iso8601DateTimeWithMillis
    let r = new Reservation(userId, restId, reservationName, people, date, '15:00');
    r.id = resId;

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
        interactor = new Interactor({
            consumer: 'reservation-mongodb-denormalizer',  // TODO: parametrize
            provider: 'reservation-service',
        }, handler);
    });

    beforeEach(() => {
        rr = new RestaurantReservations(restId, testUtils.timeTable, testUtils.getTables(restId));
        r = new Reservation(userId, restId, reservationName, people, date, '15:00');
        r.id = resId;
        eventContent.resetEventId();
        return repoReset();
    });

    it('reservationCreated is handled properly', async () => {

        const state = 'a new reservation is created';
        const eventName = 'reservationCreated';
        const content = eventContent.reservationCreatedEvent(r);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            const doc = await collection.findOne({ _id: resId });
            r.date = r.date.toJSON();
            r._revisionId = 1;
            r._id = r.resId = r.id;
            delete r.id;
            delete r.statusCode;
            delete r.table;
            assert.deepStrictEqual(doc, JSON.parse(JSON.stringify(r)));
        });
    });

    it('reservationConfirmed is handled properly', async () => {

        const newDoc = Object.assign({ _id: r.id, resId: r.id, _revisionId: 1 }, r);
        newDoc.date = newDoc.date.toJSON();
        delete newDoc.statusCode;
        delete newDoc.table;
        delete newDoc.id;
        await collection.insertOne(newDoc);
        await orderControl.updateLastProcessedEvent(r.id, 0, 1);
        const table = rr.getTables(6)[0];
        r.accepted(table);

        const state = 'a reservation has been added to the restaurant reservations and it is now confirmed';
        const eventName = 'reservationConfirmed';
        const content = eventContent.reservationConfirmedEvent(r, 2);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            r.date = r.date.toJSON();
            r._revisionId = 2;
            r._id = r.resId = r.id;
            delete r.statusCode;
            delete r.id;
            const doc = await collection.findOne({ _id: resId });
            assert.deepStrictEqual(doc, JSON.parse(JSON.stringify(r)));
        });
    });

    it('reservationCancelled is handled properly', async () => {
        const table = rr.getTables(6)[0];
        r.accepted(table);
        const newDoc = Object.assign({ _id: r.id, resId: r.id, _revisionId: 2 }, r);
        newDoc.date = newDoc.date.toJSON();
        delete newDoc.statusCode;
        delete newDoc.id;
        await collection.insertOne(newDoc);
        await orderControl.updateLastProcessedEvent(r.id, 0, 2);
        r.cancelled();

        const state = 'a reservation has been added to the restaurant reservations but it is now cancelled';
        const eventName = 'reservationCancelled';
        const content = eventContent.reservationCancelledEvent(r, 3);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            r.date = r.date.toJSON();
            r._revisionId = 3;
            r._id = r.resId = r.id;
            delete r.statusCode;
            delete r.id;
            const doc = await collection.findOne({ _id: resId });
            assert.deepStrictEqual(doc, JSON.parse(JSON.stringify(r)));
        });
    });

    it('restaurantReservationsCreated is handled properly', async () => {

        const state = 'a new restaurantReservations is created';
        const eventName = 'restaurantReservationsCreated';
        const content = eventContent.restaurantReservationsCreatedEvent(rr);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            const expected = {
                _id: rr.restId,
                restId: rr.restId,
                tables: rr.tables.map(t => {
                    const newT = JSON.parse(t.toString());
                    delete newT.reservations;
                    return newT;
                }),
                timeTable: rr.timeTable,
                reservations: [],
                _revisionId: 1,
            };

            const doc = await collection.findOne({ _id: restId });
            assert.deepStrictEqual(doc, expected);
        });
    });

    it('reservationAdded is handled properly', async () => {

        const newDoc = {
            _id: rr.restId,
            restId: rr.restId,
            tables: rr.tables.map(t => {
                const newT = JSON.parse(t.toString());
                delete newT.reservations;
                return newT;
            }),
            timeTable: rr.timeTable,
            reservations: [],
            _revisionId: 1,
        };
        await collection.insertOne(newDoc);
        await orderControl.updateLastProcessedEvent(rr.restId, 0, 1);
        const table = rr.getTables(6)[0];
        r.accepted(table);

        const state = 'a reservation is added to the restaurant reservations';
        const eventName = 'reservationAdded';
        const content = eventContent.reservationAddedEvent(r, 2);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            newDoc.reservations.push({
                restId: r.restId,
                resId: r.id,
                table: r.table,
                date: r.date.toJSON(),
            });
            newDoc._revisionId++;
            const doc = await collection.findOne({ _id: restId });
            assert.deepStrictEqual(doc, newDoc);
        });
    });

    it('reservationRemoved is handled properly', async () => {

        const table = rr.getTables(6)[0];
        r.accepted(table);
        const newDoc = {
            _id: rr.restId,
            restId: rr.restId,
            tables: rr.tables.map(t => {
                const newT = JSON.parse(t.toString());
                delete newT.reservations;
                return newT;
            }),
            timeTable: rr.timeTable,
            reservations: [{
                restId: r.restId,
                resId: r.id,
                table: r.table,
                date: r.date.toJSON(),
            }],
            _revisionId: 2,
        };
        await collection.insertOne(newDoc);
        await orderControl.updateLastProcessedEvent(rr.restId, 0, 2);

        const state = 'a reservation is removed from the restaurant reservations';
        const eventName = 'reservationRemoved';
        const content = eventContent.reservationRemovedEvent(r, 3);
        await interactor.defineAsyncInteraction(state, eventName, content, async () => {
            newDoc.reservations.pop();
            newDoc._revisionId++;
            const doc = await collection.findOne({ _id: restId });
            assert.deepStrictEqual(doc, newDoc);
        });
    });

    after(() => interactor.publishPacts());
});