const assert = require('assert');
const Event = require('@danver97/event-sourcing/event');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const handlerFunc = require('../../infrastructure/denormalizers/mongodb/handler');
const writerFunc = require('../../infrastructure/denormalizers/mongodb/writer');
const utils = require('./utils');

const mongod = new MongoMemoryServer();
let client = null;
let collection = null;
let writer = null;
let handler = null;

describe('Event Handler unit test', function () {
    const streamId = '1';
    const restaurantReservations = {
        _id: streamId,
        restId: streamId,
        timeTable: utils.timeTable,
        tables: [],
        _revisionId: 1,
    };

    const reservation = {
        id: 'asdf',
        restId: streamId,
        status: 'pending',
        statusCode: 0,
        userId: 'asdfUser',
        reservationName: 'Lucio',
        people: 4,
        date: new Date(),
    };

    before(async () => {
        this.timeout(10000);
        const mongoConfig = {
            connString: await mongod.getConnectionString(),
            db: 'Reservation',
            collection: 'Reservation',
        };
        client = new MongoClient(mongoConfig.connString, { useNewUrlParser: true });
        await client.connect();
        collection = client.db(mongoConfig.db).collection(mongoConfig.collection);
        writer = await writerFunc(mongoConfig);
        handler = handlerFunc(writer);
    });

    it('check if restaurantReservationsCreated event is handled properly', async function () {
        const e = new Event(restaurantReservations.restId, 1, 'restaurantReservationsCreated', restaurantReservations);
        // await handler(e, () => console.log(e));
        await handler(e);
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
