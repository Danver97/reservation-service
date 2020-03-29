const assert = require('assert');
const uuid = require('uuid/v4');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const Event = require('@danver97/event-sourcing/event');
const writerFunc = require('../../../../infrastructure/denormalizers/mongodb/writer');
const utils = require('./utils');

const mongod = new MongoMemoryServer();
let client = null;
let collection = null;
let writer = null;

describe('writer unit test', function () {
    let rr;
    let res;
    let resToAdd;

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
    });

    beforeEach(() => {
        rr = utils.restaurantReservations();
        res = utils.reservation();
        resToAdd = utils.reservationToAdd(rr.restId);
        return collection.deleteMany({});
    });

    it('check if restarantReservationCreated works', async function () {
        const e = new Event(rr.restId, 1, 'restaurantCreated', rr);
        await writer.restaurantReservationsCreated(e.payload);
        const doc = await collection.findOne({ _id: rr.restId });
        assert.deepStrictEqual(doc, rr);
    });

    it('check if reservationCreated works', async function () {
        // Preset

        // Update done
        const e = new Event(res.resId, 1, 'reservationCreated', res);
        await writer.reservationCreated(e.payload);

        // Assertions
        const doc = await collection.findOne({ _id: res.resId });
        assert.deepStrictEqual(doc, res);
    });

    it('check if reservationConfirmed works', async function () {
        // Preset
        const newDoc = Object.assign({ _id: res.resId }, res);
        await collection.insertOne(newDoc);
        
        // Update to do
        res.table = { id: 15, people: 4 };
        res.status = 'confirmed';

        // Update done
        const e = new Event(res.resId, 2, 'reservationConfirmed', { table: res.table, status: res.status });
        await writer.reservationConfirmed(res.resId, e.eventId - 1, e.payload);

        // Assertions
        const doc = await collection.findOne({ _id: res.resId });
        assert.deepStrictEqual(doc, res);
    });

    it('check if reservationRejected works', async function () {
        // Preset
        const newDoc = Object.assign({ _id: res.resId }, res);
        await collection.insertOne(newDoc);

        // Update to do
        res.status = 'rejected';

        // Update done
        const e = new Event(res.resId, 2, 'reservationRejected', { status: res.status });
        await writer.reservationRejected(res.resId, e.eventId - 1, res.status);

        // Assertions
        const doc = await collection.findOne({ _id: res.resId });
        assert.deepStrictEqual(doc, res);
    });

    it('check if reservationCancelled works', async function () {
        // Preset
        res.table = { id: 15, people: 4 };
        res.status = 'confirmed';
        const newDoc = Object.assign({ _id: res.resId }, res);
        await collection.insertOne(newDoc);

        // Update to do
        res.status = 'cancelled';

        // Update done
        const e = new Event(res.resId, 3, 'reservationCancelled', { status: res.status });
        await writer.reservationCancelled(res.resId, e.eventId - 1, res.status);

        // Assertions
        const doc = await collection.findOne({ _id: res.resId });
        assert.deepStrictEqual(doc, res);
    });

    after(async () => {
        await client.close();
        await mongod.stop();
    });

});
