const assert = require('assert');
const Event = require('@danver97/event-sourcing/event');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const orderControl = require('../../infrastructure/denormalizers/mongodb/orderControl')('testdb');
const writerFunc = require('../../infrastructure/denormalizers/mongodb/writer');
const handlerFunc = require('../../infrastructure/denormalizers/mongodb/handler');
const utils = require('./utils');

const mongod = new MongoMemoryServer();
let client = null;
let collection = null;
let writer = null;
let handler = null;

describe('MongoDB Denormalizer handler unit test', function () {
    const restaurantReservations = utils.restaurantReservations();
    const reservation = utils.reservation();

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

    it('check if restaurantReservationsCreated event is handled properly', async function () {
        const e = new Event(restaurantReservations.restId, 1, 'restaurantReservationsCreated', restaurantReservations);
        // await handler(e, () => console.log(e));
        await handler(e);
        console.log(await collection.findOne({}));
        const doc = await collection.findOne({ _id: restaurantReservations.restId });
        assert.deepStrictEqual(doc, restaurantReservations);
    });

    it('check if reservationAdded event is handled properly', async function () {
        const res = { id: reservation.id, date: reservation.date, userId: reservation.userId, people: reservation.people };
        res.table = { id: 15, people: 4 };
        restaurantReservations.reservations.push(res);
        restaurantReservations._revisionId++;
        const e = new Event(restaurantReservations.restId, 2, 'reservationAdded', res);
        // await handler(e, () => console.log(e));
        await handler(e);
        const doc = await collection.findOne({ _id: restaurantReservations.restId });
        assert.deepStrictEqual(doc, restaurantReservations);
    });

    it('check if reservationRemoved event is handled properly', async function () {
        restaurantReservations.reservations = restaurantReservations.reservations.filter(r => r.id !== reservation.id);
        restaurantReservations._revisionId++;
        const e = new Event(restaurantReservations.restId, 3, 'reservationRemoved', { restId: restaurantReservations.restId, resId: reservation.id });
        // await handler(e, () => console.log(e));
        await handler(e);
        const doc = await collection.findOne({ _id: restaurantReservations.restId });
        assert.deepStrictEqual(doc, restaurantReservations);
    });

    it('check if reservationCreated event is handled properly', async function () {
        const e = new Event(reservation.id, 1, 'reservationCreated', reservation);
        // await handler(e, () => console.log(e));
        await handler(e);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    it('check if reservationConfirmed event is handled properly', async function () {
        reservation.status = 'confirmed'; // changes
        reservation.table = { id: 15, people: 4 };
        reservation._revisionId++;
        const payload = { resId: reservation.id, restId: reservation.restId, table: reservation.table, status: reservation.status };
        const e = new Event(reservation.id, 2, 'reservationConfirmed', payload);
        // await handler(e, () => console.log(e));
        await handler(e);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    it('check if reservationRejected event is handled properly', async function () {
        reservation.status = 'rejected'; // changes
        reservation._revisionId++;
        const payload = { resId: reservation.id, restId: reservation.restId, status: reservation.status };
        const e = new Event(reservation.id, 3, 'reservationRejected', payload);
        // await handler(e, () => console.log(e));
        await handler(e);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });


    it('check if reservationCancelled event is handled properly', async function () {
        reservation.status = 'cancelled' // changes
        reservation._revisionId++;
        const payload = { resId: reservation.id, restId: reservation.restId, status: reservation.status };
        const e = new Event(reservation.id, 4, 'reservationCancelled', payload);
        // await handler(e, () => console.log(e));
        await handler(e);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    after(() => {
        mongod.stop();
    })

});
