const assert = require('assert');
// const uuid = require('uuid/v4');
const Reservation = require('../domain/models/reservation');
const RestaurantReservations = require('../domain/models/restaurantReservations');
const repo = require('../infrastructure/repository/repositoryManager')('testdb');
// const reservationMgr = require('../domain/logic/reservationManager')(repo);
const reservationMgr = require('../domain/logic/restaurantReservationsManager')(repo);
const ENV = require('../src/env');

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
    const rr = new RestaurantReservations(1);
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
    
    it('check if acceptReservation works (single table)', async function () {
        res = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, res)).date, setHour(expectedDate, '15:00'));
        // success 15:00
        
        const failedRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        assert.strictEqual((await reservationMgr.acceptReservation(rr.restId, failedRes)), null);
        // failure
        
        const shiftedRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:45');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, shiftedRes)).date, setHour(expectedDate, '16:00'));
        // success shift to 16:00
        
        const newRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '18:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, newRes)).date, setHour(expectedDate, '18:00'));
        // success 18:00
        
        const middleFailedRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '16:30');
        assert.strictEqual((await reservationMgr.acceptReservation(rr.restId, middleFailedRes)), null);
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
        assert.strictEqual((await reservationMgr.acceptReservation(rr.restId, failedRes)), null); 
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
        assert.strictEqual((await reservationMgr.acceptReservation(rr.restId, moreRes)), null); 
        // failure
    });
    
    it('check if cancelReservation works', async function () {
        await reservationMgr.cancelReservation(rr.restId, res); // success
        res = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        assertStrictEqualHour((await reservationMgr.acceptReservation(rr.restId, res)).date, setHour(expectedDate, '15:00'));
        // success 15:00
    });
    
    it('check if getReservations works', async function () {
        const rres = new RestaurantReservations(2);
        await repo.restaurantReservationsCreated(rres);
        const reser = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        const failedRes = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
        await reservationMgr.acceptReservation(rres.restId, reser);
        await reservationMgr.acceptReservation(rres.restId, failedRes);
        
        let result = await reservationMgr.getReservations(rres.restId);
        assert.strictEqual(JSON.stringify(result), JSON.stringify([reser]));
        
        await reservationMgr.cancelReservation(rres.restId, reser);
        result = await reservationMgr.getReservations(rres.restId);
        assert.strictEqual(JSON.stringify(result), JSON.stringify([]));
    });
});
