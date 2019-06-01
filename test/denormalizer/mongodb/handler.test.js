const assert = require('assert');
const Event = require('@danver97/event-sourcing/event');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const orderControl = require('../../../infrastructure/denormalizers/mongodb/orderControl')('testdb');
const writerFunc = require('../../../infrastructure/denormalizers/mongodb/writer');
const handlerFunc = require('../../../infrastructure/denormalizers/mongodb/handler');
const utils = require('./utils');

const mongod = new MongoMemoryServer();
let client = null;
let collection = null;
let writer = null;
let handler = null;

describe('handler unit test', function () {
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
        handler = handlerFunc(writer, orderControl);
    });

    

    beforeEach(async () => {
        rr = utils.restaurantReservations();
        res = utils.reservation();
        resToAdd = utils.reservationToAdd(rr.restId);
        await orderControl.db.reset();
        await collection.deleteMany({});
    });

    it('check if restaurantReservationsCreated event is handled properly', async function () {
        // Update done
        const e = new Event(rr.restId, 1, 'restaurantReservationsCreated', rr);
        await handler(e);
        
        // Assertions
        const doc = await collection.findOne({ _id: rr.restId });
        assert.deepStrictEqual(doc, rr);
    });

    it('check if reservationAdded event is handled properly', async function () {
        // Preset
        await collection.insertOne(rr);
        await orderControl.updateLastProcessedEvent(rr.restId, 0, 1);

        // Update to do
        rr.reservations.push(resToAdd);
        rr._revisionId++;

        // Update done
        const e = new Event(rr.restId, 2, 'reservationAdded', resToAdd);
        await handler(e);

        // Assertions
        const doc = await collection.findOne({ _id: rr.restId });
        assert.deepStrictEqual(doc, rr);
    });

    it('check if reservationRemoved event is handled properly', async function () {
        // Preset
        rr.reservations.push(resToAdd);
        rr._revisionId++;
        const newDoc = Object.assign({ _id: rr.restId, _revisionId: 2 }, rr);
        await collection.insertOne(newDoc);
        await orderControl.updateLastProcessedEvent(rr.restId, 0, 2);

        // Update to do
        rr.reservations = rr.reservations.filter(r => r.resId !== resToAdd.resId);
        rr._revisionId++;

        // Update done
        const e = new Event(rr.restId, 3, 'reservationRemoved', { restId: rr.restId, resId: resToAdd.resId });
        await handler(e);

        // Assertions
        const doc = await collection.findOne({ _id: rr.restId });
        assert.deepStrictEqual(doc, rr);
    });

    it('check if reservationCreated event is handled properly', async function () {
        // Preset

        // Update done
        const e = new Event(res.resId, 1, 'reservationCreated', res);
        await handler(e);

        // Assertions
        const doc = await collection.findOne({ _id: res.resId });
        assert.deepStrictEqual(doc, res);
    });

    it('check if reservationConfirmed event is handled properly', async function () {
        // Preset
        const newDoc = Object.assign({ _id: res.resId, _revisionId: 1 }, res);
        await collection.insertOne(newDoc);
        await orderControl.updateLastProcessedEvent(res.resId, 0, 1);
        
        // Update to do
        res.status = 'confirmed';
        res.table = { id: 15, people: 4 };
        res._revisionId++;

        // Update done
        const payload = { resId: res.resId, restId: res.restId, table: res.table, status: res.status };
        const e = new Event(res.resId, 2, 'reservationConfirmed', payload);
        await handler(e);

        // Assertions
        const doc = await collection.findOne({ _id: res.resId });
        assert.deepStrictEqual(doc, res);
    });

    it('check if reservationRejected event is handled properly', async function () {
        // Preset
        const newDoc = Object.assign({ _id: res.resId, _revisionId: 1 }, res);
        await collection.insertOne(newDoc);
        await orderControl.updateLastProcessedEvent(res.resId, 0, 1);

        // Update to do
        res.status = 'rejected'; // changes
        res._revisionId++;

        // Update done
        const payload = { resId: res.resId, restId: res.restId, status: res.status };
        const e = new Event(res.resId, 2, 'reservationRejected', payload);
        await handler(e);

        // Assertions
        const doc = await collection.findOne({ _id: res.resId });
        assert.deepStrictEqual(doc, res);
    });


    it('check if reservationCancelled event is handled properly', async function () {
        // Preset
        res.table = { id: 15, people: 4 };
        res.status = 'confirmed';
        res._revisionId++;
        const newDoc = Object.assign({ _id: res.resId, _revisionId: 2 }, res);
        await collection.insertOne(newDoc);
        await orderControl.updateLastProcessedEvent(res.resId, 0, 2);

        // Update to do
        res.status = 'cancelled' // changes
        res._revisionId++;
        const payload = { resId: res.resId, restId: res.restId, status: res.status };

        // Update done
        const e = new Event(res.resId, 3, 'reservationCancelled', payload);
        await handler(e);

        // Assertions
        const doc = await collection.findOne({ _id: res.resId });
        assert.deepStrictEqual(doc, res);
    });

    after(async () => {
        await mongod.stop();
        await orderControl.db.reset();
    });

});
