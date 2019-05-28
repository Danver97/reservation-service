const assert = require('assert');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const Event = require('@danver97/event-sourcing/event');
const writerFunc = require('../../infrastructure/denormalizers/mongodb/writer');
const utils = require('./utils');

const mongod = new MongoMemoryServer();
let client = null;
let collection = null;
let writer = null;

describe('MongoDB projector unit test', function () {
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
    });

    it('check if restarantReservationCreated works', async function () {
        const e = new Event(streamId, 1, 'restaurantCreated', restaurantReservations);
        await writer.restaurantReservationsCreated(e.payload);
        const doc = await collection.findOne({ _id: restaurantReservations.restId });
        assert.deepStrictEqual(doc, restaurantReservations);
    });

    it('check if reservationAdded works', async function () {
        const res = { id: reservation.id, date: reservation.date, userId: reservation.userId, people: reservation.people };
        res.table = { id: 15, people: 4 };
        restaurantReservations.reservations.push(res);
        restaurantReservations._revisionId++;
        const e = new Event(streamId, 2, 'reservationAdded', res);
        await writer.reservationAdded(restaurantReservations.restId, e.eventId - 1, res);
        const doc = await collection.findOne({ _id: restaurantReservations.restId });
        assert.deepStrictEqual(doc, restaurantReservations);
    });

    it('check if reservationRemoved works', async function () {
        restaurantReservations.reservations = restaurantReservations.reservations.filter(r => r.id != reservation.id);
        restaurantReservations._revisionId++;
        const e = new Event(streamId, 3, 'reservationRemoved', { restId: restaurantReservations.restId, resId: reservation.id });
        await writer.reservationRemoved(restaurantReservations.restId, e.eventId - 1, e.payload.resId);
        const doc = await collection.findOne({ _id: restaurantReservations.restId });
        assert.deepStrictEqual(doc, restaurantReservations);
    });

    it('check if reservationCreated works', async function () {
        const e = new Event(streamId, 1, 'reservationCreated', reservation);
        await writer.reservationCreated(reservation);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    it('check if reservationConfirmed works', async function () {
        reservation.table = { id: 15, people: 4 };
        reservation.status = 'confirmed';
        reservation._revisionId++;
        const e = new Event(streamId, 2, 'reservationConfirmed', { table: reservation.table, status: reservation.status });
        await writer.reservationConfirmed(reservation.id, e.eventId - 1, e.payload);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    it('check if reservationRejected works', async function () {
        reservation.status = 'rejected';
        reservation._revisionId++;
        const e = new Event(streamId, 3, 'reservationRejected', { status: reservation.status });
        await writer.reservationRejected(reservation.id, e.eventId - 1, reservation.status);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    it('check if reservationCancelled works', async function () {
        reservation.status = 'cancelled';
        reservation._revisionId++;
        const e = new Event(streamId, 4, 'reservationCancelled', { status: reservation.status });
        await writer.reservationCancelled(reservation.id, e.eventId - 1, reservation.status);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    after(async () => {
        await client.close();
        await mongod.stop();
    });

});
