const assert = require('assert');
const Table = require('../../domain/models/table');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const repo = require('../../infrastructure/repository/repositoryManager')('testdb', { eventStoreName: 'prova2'});
const reservationMgr = require('../../domain/logic/restaurantReservationsManager')(repo);
const assertDeepStrictEqual = require('../../lib/utils').assertStrictEqual;

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

const assertRestaurantContainsRes = async (res) => {
    let rr_result = await repo.getReservations(res.restId);
    assertDeepStrictEqual(rr_result.reservationMap[res.id], res);
}

const assertRestaurantDoesNotContainsRes = async (res) => {
    let rr_result = await repo.getReservations(res.restId);
    assert.deepStrictEqual(rr_result.reservationMap[res.id], undefined);
}

const assertReservationExistsAndEquals = async (res) => {
    let result = await repo.getReservation(res.id);
    assertDeepStrictEqual(result, res);
}

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
    let rr = new RestaurantReservations({ restId: '1', timeTable });
    let rr2 = new RestaurantReservations({ restId: '2', timeTable, acceptationMode: RestaurantReservations.acceptationModes.AUTO_THRESHOLD });
    let rr3 = new RestaurantReservations({ restId: '3', timeTable, acceptationMode: RestaurantReservations.acceptationModes.AUTO_THRESHOLD, threshold: 5, maxReservationSize: 2 });
    let res;

    const tomorrow = new Date(Date.now());
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setSeconds(0);
    tomorrow.setMilliseconds(0);
    const expectedDate = new Date(tomorrow);

    beforeEach(async () => {
        rr = new RestaurantReservations({ restId: '1', timeTable });
        rr2 = new RestaurantReservations({ restId: '2', timeTable, acceptationMode: RestaurantReservations.acceptationModes.AUTO_THRESHOLD });
        rr3 = new RestaurantReservations({ restId: '3', timeTable, acceptationMode: RestaurantReservations.acceptationModes.AUTO_THRESHOLD, threshold: 5, maxReservationSize: 2 });
        await repo.reset();
        await repo.restaurantReservationsCreated(rr);
        await repo.restaurantReservationsCreated(rr2);
        await repo.restaurantReservationsCreated(rr3);
    });

    it('check if reservationCreated works', async function () {
        const res = new Reservation('pippo', rr.restId, 'pippo', 2, tomorrow.toLocaleDateString(), '15:00');
        assert.deepStrictEqual(await reservationMgr.reservationCreated(res), res);
        assert.strictEqual(res.status, Reservation.statuses.pending);
        await assertReservationExistsAndEquals(res);
        await assertRestaurantDoesNotContainsRes(res);

        const res2 = new Reservation('pippo', rr2.restId, 'pippo', 2, tomorrow.toLocaleDateString(), '15:00');
        assert.deepStrictEqual(await reservationMgr.reservationCreated(res2), res2);
        assert.strictEqual(res2.status, Reservation.statuses.confirmed);
        await assertReservationExistsAndEquals(res2);
        await assertRestaurantContainsRes(res2);

        let res3 = new Reservation('pippo', rr3.restId, 'pippo', 4, tomorrow.toLocaleDateString(), '15:00');
        assert.deepStrictEqual(await reservationMgr.reservationCreated(res3), res3);
        assert.strictEqual(res3.status, Reservation.statuses.pending);
        await assertReservationExistsAndEquals(res3);
        await assertRestaurantDoesNotContainsRes(res3);

        res3 = new Reservation('pippo', rr3.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        assert.deepStrictEqual(await reservationMgr.reservationCreated(res3), res3);
        assert.strictEqual(res3.status, Reservation.statuses.pending);
        await assertReservationExistsAndEquals(res3);
        await assertRestaurantDoesNotContainsRes(res3);
    });

    it('check if acceptReservation works', async function () {
        const res = new Reservation('pippo', rr.restId, 'pippo', 2, tomorrow.toLocaleDateString(), '15:00');
        const t = repo.startTransaction();
        t.reservationCreated(res);
        await t.commit();

        res.confirmed();
        assertDeepStrictEqual(await reservationMgr.acceptReservation(res.restId, res.id), res);
        const result = await repo.getReservation(res.id);
        assertDeepStrictEqual(result, res);
        await assertRestaurantContainsRes(res);
        
        
        const res3 = new Reservation('pippo', rr3.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        const t2 = repo.startTransaction();
        t2.reservationCreated(res3);
        await t2.commit();
        
        res3.confirmed();
        assertDeepStrictEqual(await reservationMgr.acceptReservation(res3.restId, res3.id), res3);
        const result2 = await repo.getReservation(res3.id);
        assertDeepStrictEqual(result2, res3);
        await assertRestaurantContainsRes(res3);
    });

    it('check if reservationCancelled works', async function () {
        const res = new Reservation('pippo', rr.restId, 'pippo', 2, tomorrow.toLocaleDateString(), '15:00');
        const t = repo.startTransaction();
        t.reservationCreated(res);
        await t.commit();

        res.cancelled();
        assertDeepStrictEqual(await reservationMgr.reservationCancelled(res.id), res);
        const result = await repo.getReservation(res.id);
        assertDeepStrictEqual(result, res);
        await assertRestaurantDoesNotContainsRes(res);
        
        const res2 = new Reservation('pippo', rr2.restId, 'pippo', 2, tomorrow.toLocaleDateString(), '15:00');
        const t2 = repo.startTransaction();
        let rr2FromRepo = await repo.getReservations(res2.restId);
        t2.reservationCreated(res2);
        rr2FromRepo.acceptReservation(res2);
        t2.reservationConfirmed(res2);
        t2.reservationAdded(rr2FromRepo, res2);
        await t2.commit();
        
        res2.cancelled();
        assertDeepStrictEqual(await reservationMgr.reservationCancelled(res2.id), res2);
        const result2 = await repo.getReservation(res2.id);
        assertDeepStrictEqual(result2, res2);
        await assertRestaurantDoesNotContainsRes(res2);
    });
});
