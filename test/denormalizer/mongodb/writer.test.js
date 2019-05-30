const assert = require('assert');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const Event = require('@danver97/event-sourcing/event');
const writerFunc = require('../../../infrastructure/denormalizers/mongodb/writer');
const utils = require('./utils');

const mongod = new MongoMemoryServer();
let client = null;
let collection = null;
let writer = null;

describe('writer unit test', function () {
    const rr = utils.restaurantReservations();
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
    });

    it('check if restarantReservationCreated works', async function () {
        const e = new Event(rr.restId, 1, 'restaurantCreated', rr);
        await writer.restaurantReservationsCreated(e.payload);
        const doc = await collection.findOne({ _id: rr.restId });
        assert.deepStrictEqual(doc, rr);
    });

    it('check if reservationAdded works', async function () {
        const res = { id: reservation.id, date: reservation.date, userId: reservation.userId, people: reservation.people };
        res.table = { id: 15, people: 4 };
        rr.reservations.push(res);
        rr._revisionId++;
        const e = new Event(rr.restId, 2, 'reservationAdded', res);
        await writer.reservationAdded(rr.restId, e.eventId - 1, res);
        const doc = await collection.findOne({ _id: rr.restId });
        assert.deepStrictEqual(doc, rr);
    });

    it('check if reservationRemoved works', async function () {
        rr.reservations = rr.reservations.filter(r => r.id != reservation.id);
        rr._revisionId++;
        const e = new Event(rr.restId, 3, 'reservationRemoved', { restId: rr.restId, resId: reservation.id });
        await writer.reservationRemoved(rr.restId, e.eventId - 1, e.payload.resId);
        const doc = await collection.findOne({ _id: rr.restId });
        assert.deepStrictEqual(doc, rr);
    });

    it('check if reservationCreated works', async function () {
        const e = new Event(rr.restId, 1, 'reservationCreated', reservation);
        await writer.reservationCreated(reservation);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    it('check if reservationConfirmed works', async function () {
        reservation.table = { id: 15, people: 4 };
        reservation.status = 'confirmed';
        reservation._revisionId++;
        const e = new Event(rr.restId, 2, 'reservationConfirmed', { table: reservation.table, status: reservation.status });
        await writer.reservationConfirmed(reservation.id, e.eventId - 1, e.payload);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    it('check if reservationRejected works', async function () {
        reservation.status = 'rejected';
        reservation._revisionId++;
        const e = new Event(rr.restId, 3, 'reservationRejected', { status: reservation.status });
        await writer.reservationRejected(reservation.id, e.eventId - 1, reservation.status);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    it('check if reservationCancelled works', async function () {
        reservation.status = 'cancelled';
        reservation._revisionId++;
        const e = new Event(rr.restId, 4, 'reservationCancelled', { status: reservation.status });
        await writer.reservationCancelled(reservation.id, e.eventId - 1, reservation.status);
        const doc = await collection.findOne({ _id: reservation.id });
        assert.deepStrictEqual(doc, reservation);
    });

    after(async () => {
        await client.close();
        await mongod.stop();
    });

});
