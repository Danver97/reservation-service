const assert = require('assert');
const uuid = require('uuid/v4');
const Event = require('@danver97/event-sourcing/event');

const assertStrictEqual = require('../../lib/utils').assertStrictEqual;
const Table = require('../../domain/models/table');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const repo = require('../../infrastructure/repository/repositoryManager')('testdb');
const RepositoryError = require('../../infrastructure/repository/errors/RepositoryError');
const reservationEvents = require('../../lib/reservation-events');
const ENV = require('../../src/env');

function restaurantReservationsEqual(actual, expected) {
    assert.strictEqual(actual.restId, expected.restId);
    assert.deepStrictEqual(actual.timeTable, expected.timeTable);
    assert.deepStrictEqual(actual.reservationsTableId, expected.reservationsTableId);
    assert.deepStrictEqual(actual.tablesMap, expected.tablesMap);
    assert.deepStrictEqual(actual.tables, expected.tables);
}

function toJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

describe('RepositoryManager unit test', function() {
    const timeTable = {
        Monday: '7:00-18:00',
        Tuesday: '7:00-18:00',
        Wednesday: '7:00-18:00',
        Thursday: '7:00-18:00',
        Friday: '7:00-18:00',
        Saturday: '7:00-18:00',
        Sunday: '7:00-18:00',
    };
    const tables = [
        new Table(1, 1, 2),
        new Table(2, 1, 3),
        new Table(3, 1, 4),
        new Table(4, 1, 4),
        new Table(5, 1, 4),
        new Table(6, 1, 6),
    ];
    const threshold = 20;

    const tomorrow = new Date(Date.now());
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rrDefault = new RestaurantReservations({ restId: uuid(), timeTable, tables, threshold });
    // let res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
    // let rejectedRes = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');;

    before(() => {
        repo.reset();
    });

    beforeEach(async () => {
        repo.reset();

    });

    it('check if restaurantReservationsCreated works', async function () {
        assert.throws(() => repo.restaurantReservationsCreated(), RepositoryError);

        const rr2 = new RestaurantReservations({ restId: uuid(), timeTable, tables, threshold });
        await repo.restaurantReservationsCreated(rr2);
        const events = await repo.db.getStream(rr2.restId);
        const lastEvent = events[events.length - 1];

        assert.strictEqual(lastEvent.streamId, rr2.restId);
        assert.strictEqual(lastEvent.eventId, 1);
        assert.strictEqual(lastEvent.message, reservationEvents.restaurantReservationsCreated);
        assert.deepStrictEqual(lastEvent.payload, toJSON({ restId: rr2.restId, timeTable: rr2.timeTable, tables: rr2.tables, threshold: rr2.threshold }));
    });

    it('check if reservationCreated works', async function () {
        assert.throws(() => repo.reservationCreated(), RepositoryError);

        // Preset
        const rr = new RestaurantReservations({ restId: uuid(), timeTable, tables, threshold });
        const payload1 = { restId: rr.restId, timeTable: rr.timeTable, tables: rr.tables };
        const e1 = new Event(rr.restId, 1, reservationEvents.restaurantReservationsCreated, payload1);
        await repo.db.saveEvent(e1);
        rr._revisionId = 1;

        // Update
        const res2 = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        await repo.reservationCreated(res2);

        // Assertions
        const events = await repo.db.getStream(res2.resId);
        const lastEvent = events[events.length - 1];
        
        assert.strictEqual(lastEvent.streamId, res2.resId);
        assert.strictEqual(lastEvent.eventId, 1);
        assert.strictEqual(lastEvent.message, reservationEvents.reservationCreated);
        delete res2.id;
        assert.deepStrictEqual(lastEvent.payload, toJSON(res2));
    });

    it('check if reservationConfirmed works', async function () {
        assert.throws(() => repo.reservationConfirmed(), RepositoryError);

        // Preset
        const res = new Reservation('pippo', rrDefault.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        const payload2 = Object.assign({}, res);
        delete payload2.id;
        const e2 = new Event(res.resId, 1, reservationEvents.reservationCreated, payload2);
        await repo.db.saveEvent(e2);
        res._revisionId = 1;

        // Update
        res.accepted(); // res.accepted(tables[0]);
        await repo.reservationConfirmed(res);

        // Assertions
        const events = await repo.db.getStream(res.resId);
        const lastEvent = events[events.length - 1];
        
        assert.strictEqual(lastEvent.streamId, res.resId);
        assert.strictEqual(lastEvent.eventId, 2);
        assert.strictEqual(lastEvent.message, reservationEvents.reservationConfirmed);
        assert.deepStrictEqual(lastEvent.payload, { resId: res.resId, date: res.date.toISOString(), restId: res.restId, status: 'confirmed' }); // , table: res.table
    });

    it('check if reservationRejected works', async function () {
        assert.throws(() => repo.reservationRejected(), RepositoryError);

        // Preset
        const rejectedRes = new Reservation('pippo', rrDefault.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        const payload3 = Object.assign({}, rejectedRes);
        delete payload3.id;
        const e3 = new Event(rejectedRes.resId, 1, reservationEvents.reservationCreated, payload3);
        await repo.db.saveEvent(e3);
        rejectedRes._revisionId = 1;

        // Update
        rejectedRes.rejected();
        await repo.reservationRejected(rejectedRes);

        // Assertions
        const events = await repo.db.getStream(rejectedRes.resId);
        const lastEvent = events[events.length - 1];

        assert.strictEqual(lastEvent.streamId, rejectedRes.resId);
        assert.strictEqual(lastEvent.eventId, 2);
        assert.strictEqual(lastEvent.message, reservationEvents.reservationRejected);
        assert.deepStrictEqual(lastEvent.payload, { resId: rejectedRes.resId, restId: rejectedRes.restId, status: 'rejected' });
    });

    it('check if reservationAdded works', async function () {
        assert.throws(() => repo.reservationAdded(), RepositoryError);

        // Presets
        const rr = new RestaurantReservations({ restId: uuid(), timeTable, tables, threshold });
        const payload1 = { restId: rr.restId, timeTable: rr.timeTable, tables: rr.tables };
        const e1 = new Event(rr.restId, 1, reservationEvents.restaurantReservationsCreated, payload1);
        await repo.db.saveEvent(e1);
        rr._revisionId = 1;

        const res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        res.accepted(tables[0]);

        // Update
        rr.reservationAdded(res);
        await repo.reservationAdded(rr, res);

        // Assertions
        const events = await repo.db.getStream(rr.restId);
        const lastEvent = events[events.length - 1];
        
        assert.strictEqual(lastEvent.streamId, rr.restId);
        assert.strictEqual(lastEvent.eventId, 2);
        assert.strictEqual(lastEvent.message, reservationEvents.reservationAdded);
        const payload = toJSON(res);
        assert.deepStrictEqual(lastEvent.payload, payload);
    });

    it('check if reservationCancelled works', async function () {
        assert.throws(() => repo.reservationCancelled(), RepositoryError);

        // Preset
        const res = new Reservation('pippo', rrDefault.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        const payload2 = Object.assign({}, res);
        delete payload2.id;
        const e2 = new Event(res.resId, 1, reservationEvents.reservationCreated, payload2);
        await repo.db.saveEvent(e2);
        res._revisionId = 1;

        res.accepted(tables[0]);
        await repo.db.saveEvent(new Event(res.resId, 2, reservationEvents.reservationConfirmed, { resId: res.resId, date: res.date.toISOString(), restId: res.restId, status: 'confirmed', table: res.table }));
        res._revisionId = 2;

        // Update
        res.cancelled();
        await repo.reservationCancelled(res);        
        
        // Assertions
        const events = await repo.db.getStream(res.resId);
        const lastEvent = events[events.length - 1];
        
        assert.strictEqual(lastEvent.streamId, res.resId);
        assert.strictEqual(lastEvent.eventId, 3);
        assert.strictEqual(lastEvent.message, reservationEvents.reservationCancelled);
        assert.deepStrictEqual(lastEvent.payload, { resId: res.resId, restId: res.restId, status: 'cancelled' });
    });

    it('check if reservationRemoved works', async function () {
        assert.throws(() => repo.reservationRemoved(), RepositoryError);

        // Preset
        const rr = new RestaurantReservations({ restId: uuid(), timeTable, tables, threshold });
        const payload1 = { restId: rr.restId, timeTable: rr.timeTable, tables: rr.tables };
        const e1 = new Event(rr.restId, 1, reservationEvents.restaurantReservationsCreated, payload1);
        await repo.db.saveEvent(e1);
        rr._revisionId = 1;
        
        const res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        res.accepted(tables[0]);
        rr.reservationAdded(res);
        await repo.db.saveEvent(new Event(rr.restId, 2, reservationEvents.reservationAdded, toJSON(res)));
        rr._revisionId = 2;

        // Update
        rr.reservationRemoved(res.id);
        await repo.reservationRemoved(rr, res.id);

        // Assertions
        const events = await repo.db.getStream(rr.restId);
        const lastEvent = events[events.length - 1];
        
        assert.strictEqual(lastEvent.streamId, rr.restId);
        assert.strictEqual(lastEvent.eventId, 3);
        assert.strictEqual(lastEvent.message, reservationEvents.reservationRemoved);
        assert.deepStrictEqual(lastEvent.payload, { resId: res.resId, restId: rr.restId});
    });

    it('check if getReservations works', async function () {
        assert.throws(() => repo.getReservations(), RepositoryError);
        await assert.rejects(() => repo.getReservations('noneid'), RepositoryError);

        
        // Preset
        const rr = new RestaurantReservations({ restId: uuid(), timeTable, tables, threshold });
        const payload1 = { restId: rr.restId, timeTable: rr.timeTable, tables: rr.tables, threshold: rr.threshold };
        const e1 = new Event(rr.restId, 1, reservationEvents.restaurantReservationsCreated, payload1);
        await repo.db.saveEvent(e1);
        rr._revisionId = 1;
        
        const res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        res.accepted(tables[0]);
        rr.reservationAdded(res);
        await repo.db.saveEvent(new Event(rr.restId, 2, reservationEvents.reservationAdded, toJSON(res)));
        rr._revisionId = 2;
        
        rr.reservationRemoved(res.id);
        await repo.db.saveEvent(new Event(rr.restId, 3, reservationEvents.reservationRemoved, { resId: res.resId, restId: rr.restId}));
        rr._revisionId = 3;
        
        // "Update"
        const result = await repo.getReservations(rr.restId);

        // Assertions
        rr.tables = rr.tables.sort((a, b) => a.id <= b.id ? -1 : 1);
        result.tables = result.tables.sort((a, b) => a.id <= b.id ? -1 : 1);
        restaurantReservationsEqual(result, rr);
    });

    it('check if getReservation works', async function () {
        assert.throws(() => repo.getReservation(), RepositoryError);
        await assert.rejects(() => repo.getReservation('noneid'), RepositoryError);
        
    });
});
