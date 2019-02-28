const assert = require('assert');
// const uuid = require('uuid/v4');
const Table = require('../domain/models/table');
const Reservation = require('../domain/models/reservation');
const RestaurantReservations = require('../domain/models/restaurantReservations');
const repo = require('../infrastructure/repository/repositoryManager')('testdb');
// const reservationMgr = require('../domain/logic/reservationManager')(repo);
const reservationMgr = require('../domain/logic/restaurantReservationsManager')(repo);
const ENV = require('../src/env');
const assertStrictEqual = require('../lib/utils').assertStrictEqual;

const parseHour = hourStr => {
    const h = hourStr.split(':');
    if (!h[1])
        throw new Error('Invalid object hourStr parameter.');
    const h1 = parseInt(h[0], 10);
    const m1 = parseInt(h[1], 10);
    if (isNaN(h1) || isNaN(m1))
        throw new Error('Invalid object hourStr parameter.');
    return { h: h1, m: m1 };
};

const setHour = (date, hourStr) => {
    const hourObj = parseHour(hourStr);
    date.setHours(hourObj.h);
    date.setMinutes(hourObj.m);
    return date;
};

const assertStrictEqualHour = (actual, expected) => {
    assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
};

describe('RestaurantReservationManager unit test', function () {
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
    const rr = new RestaurantReservations(1, timeTable, tables);
    let res;

    const tomorrow = new Date(Date.now());
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setSeconds(0);
    tomorrow.setMilliseconds(0);
    const expectedDate = new Date(tomorrow);

    before(async () => {
        if (ENV.node_env === 'test' && ENV.event_store === 'testdb')
            repo.reset();
        else if (ENV.node_env === 'test_event_sourcing' && ENV.event_store === 'testdb')
            repo.reset();
        await repo.restaurantReservationsCreated(rr);
    });

    it('check if reservationCreated works', async function () {
        res = new Reservation('pippo', rr.restId, 'pippo', 2, tomorrow.toLocaleDateString(), '15:00');
        assertStrictEqual(await reservationMgr.reservationCreated(res), res);
        const result = await repo.getReservation(res.id);
        assertStrictEqual(result, res);
    });

    it('check if reservationConfirmed works', async function () {
        res.accepted(tables[0]);
        assertStrictEqual(await reservationMgr.reservationConfirmed(res.id, res.table, res.date), res);
        const result = await repo.getReservation(res.id);
        assertStrictEqual(result, res);
    });

    it('check if reservationCancelled works', async function () {
        res.cancelled();
        assertStrictEqual(await reservationMgr.reservationCancelled(res.id), res);
        const result = await repo.getReservation(res.id);
        assertStrictEqual(result, res);
    });

    it('check if acceptReservation works (single table)', async function () {
        res = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, res)).date, setHour(expectedDate, '15:00'));
        // success 15:00

        const failedRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        assert.strictEqual((await reservationMgr.acceptReservation(rr.restId, failedRes)).status, 'rejected');
        // failure

        const shiftedRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:45');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, shiftedRes)).date, setHour(expectedDate, '16:00'));
        // success shift to 16:00

        const newRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '18:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, newRes)).date, setHour(expectedDate, '18:00'));
        // success 18:00

        const middleFailedRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '16:30');
        assert.strictEqual((await reservationMgr.acceptReservation(rr.restId, middleFailedRes)).status, 'rejected');
        // failure

        const middleShiftedRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '17:15');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, middleShiftedRes)).date, setHour(expectedDate, '17:00'));
        // success shift to 17:00
    });

    it('check if acceptReservation works (multiple tables)', async function () {
        const reser1 = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '15:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, reser1)).date, setHour(expectedDate, '15:00'));
        // success 15:00
        const reser2 = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '15:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, reser2)).date, setHour(expectedDate, '15:00'));
        // success 15:00
        const reser3 = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '15:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, reser3)).date, setHour(expectedDate, '15:00'));
        // success 15:00
        const failedRes = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '15:00');
        assert.strictEqual((await reservationMgr.acceptReservation(rr.restId, failedRes)).status, 'rejected');
        // failure


        let moreRes = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '17:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, moreRes)).date, setHour(expectedDate, '17:00'));
        // success 17:00
        moreRes = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '17:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, moreRes)).date, setHour(expectedDate, '17:00'));
        // success 17:00
        moreRes = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '16:45');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, moreRes)).date, setHour(expectedDate, '16:45'));
        // success 16:45


        moreRes = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '15:45');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, moreRes)).date, setHour(expectedDate, '16:00'));
        // success 16:00
        moreRes = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '16:15');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, moreRes)).date, setHour(expectedDate, '16:00'));
        // success 16:00
        moreRes = new Reservation('pippo', rr.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '16:00');
        assert.strictEqual((await reservationMgr.acceptReservation(rr.restId, moreRes)).status, 'rejected');
        // failure
    });

    it('check if cancelReservation works', async function () {
        await reservationMgr.reservationRemoved(rr.restId, res); // success
        res = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, res)).date, setHour(expectedDate, '15:00'));
        // success 15:00
    });
});
