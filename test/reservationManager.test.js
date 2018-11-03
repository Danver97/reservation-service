const assert = require('assert');
const Reservation = require('../models/reservation');
const repo = require('../modules/repositoryManager');
const reservationMgr = require('../modules/reservationManager');
const ENV = require('../src/env');

const waitAsync = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));
const waitAsyncTimeout = 20;
    
const add = (user, restId, username, people, date, hour) => new Promise(async (resolve, reject) => {
    await waitAsync(waitAsyncTimeout);
    try {
        const res = new Reservation(user, restId, username, people, date, hour);
        await reservationMgr.addReservation(res);
        assert.strictEqual(res.status, 'pending');
        resolve();
    } catch (e) {
        reject(e);
    }
});

const accept = async (user, restId, username, people, date, hour, expectedTable, expectedHour, expectedMin) => {
    await waitAsync(waitAsyncTimeout);
    let res2 = new Reservation(user, restId, username, people, date, hour);
    await reservationMgr.addReservation(res2);
    assert.strictEqual(res2.status, 'pending');
    await waitAsync(waitAsyncTimeout);
    res2 = await reservationMgr.acceptReservation(res2);
    assert.strictEqual(res2.status, 'accepted');
    assert.strictEqual(res2.tableId, expectedTable);
    assert.strictEqual(res2.date.getHours(), expectedHour);
    assert.strictEqual(res2.date.getMinutes(), expectedMin);
};

const fail = async (user, restId, username, people, date, hour) => {
    await waitAsync(waitAsyncTimeout);
    let res2 = new Reservation(user, restId, username, people, date, hour);
    await reservationMgr.addReservation(res2);
    assert.strictEqual(res2.status, 'pending');
    await waitAsync(waitAsyncTimeout);
    res2 = await reservationMgr.acceptReservation(res2);
    assert.strictEqual(res2.status, 'failed');
};

const sleep = milliseconds => {
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds)
            break;
    }
};

describe('ReservationManager unit test', function () {
    const user = 'pippo';
    const restId = 1;
    const username = 'pippo';
    const people = 4;
    const date = '2018-07-15';
    // const hour = '15:00';
    const date2 = '2018-07-16';
    const timeout = 1;
    
    before(() => {
        if (ENV.node_env === 'test')
            repo.reset();
        else if (ENV.node_env === 'test_event_sourcing')
            repo.store.reset();
    });
    
    it('check if addReservation() works', async function () {
        await add(user, restId, username, people, date, '15:00');
        sleep(timeout);
    });
    
    it('check if acceptReservation() accept new reservation', async function () {
        await accept(user, restId, username, people, date, '15:00', 4, 15, 0);
        sleep(timeout);
    });
    
    it('check if additional res are accepted properly and the last one fails', async function () {
        await accept(user, restId, username, people, date, '15:45', 5, 15, 45);
        sleep(timeout);
        await accept(user, restId, username, people, date, '15:00', 5, 14, 45);
        sleep(timeout);
        await accept(user, restId, username, people, date, '15:00', 6, 15, 0);
        sleep(timeout);
        await fail(user, restId, username, people, date, '15:00');
        sleep(timeout);
    });
    
    it('check if other res are still accepted', async function () {
        await accept(user, restId, username, people, date, '17:00', 3, 17, 0);
        sleep(timeout);
        await accept(user, restId, username, people, date, '17:00', 4, 17, 0);
        sleep(timeout);
        await accept(user, restId, username, people, date, '16:00', 4, 16, 0);
        sleep(timeout);
    });
    
    it('check if res on another day are still accepted', async function () {
        await add(user, restId, username, people, date2, '16:00');
        sleep(timeout);
        await add(user, restId, username, people, date2, '17:00');
        sleep(timeout);
        await accept(user, restId, username, people, date, '17:00', 5, 17, 0);
    });
});
