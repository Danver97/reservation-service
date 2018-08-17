const assert = require('assert');
const Reservation = require("../models/reservation");
const repo = require("../modules/repositoryManager");
const reservationMgr = require("../modules/reservationManager");
const ENV = require('../src/env');

describe('ReservationManager unit test', function () {
    let user = "pippo", restId = 1, username = "pippo", people = 4, date = "2018-07-15", hour = "15:00";
    let date2 = "2018-07-16";
    let timeout = 1;
    const add = (user, restId, username, people, date, hour) => {
        return new Promise(async (resolve, reject) => {
            try {
                let res = new Reservation(user, restId, username, people, date, hour);
                await reservationMgr.addReservation(res);
                assert.strictEqual(res.status, "pending");
                resolve();
            } catch(e) {
                reject(e);
            }
        });
    };
    
    const accept = (user, restId, username, people, date, hour, expectedTable, expectedHour, expectedMin) => {
        return new Promise(async (resolve, reject) => {
            try{
                let res2 = new Reservation(user, restId, username, people, date, hour);
                await reservationMgr.addReservation(res2);
                assert.strictEqual(res2.status, "pending");
                res2 = await reservationMgr.acceptReservation(res2);
                assert.strictEqual(res2.status, "accepted");
                assert.strictEqual(res2.tableId, expectedTable);
                assert.strictEqual(res2.date.getHours(), expectedHour);
                assert.strictEqual(res2.date.getMinutes(), expectedMin);
                resolve();
            } catch(e) {
                reject(e);
            }
        });
    };
    
    const fail = (user, restId, username, people, date, hour) => {
        return new Promise(async (resolve, reject) => {
            try {
                let res2 = new Reservation(user, restId, username, people, date, hour);
                await reservationMgr.addReservation(res2);
                assert.strictEqual(res2.status, "pending");
                res2 = await reservationMgr.acceptReservation(res2);
                assert.strictEqual(res2.status, "failed");
                resolve();
            } catch(e) {
                reject(e);
            }
        })
    };
    
    const sleep = (milliseconds) => {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }
    it('check if addReservation() works', async function () {
        if(ENV.test === "true")
            repo.reset();
        await add(user, restId, username, people, date, "15:00");
        sleep(timeout);
    });
    
    it('check if acceptReservation() accept new reservation', async function () {
        await accept(user, restId, username, people, date, "15:00", 4, 15,00);
        sleep(timeout);
    });
    
    it('check if additional res are accepted properly and the last one fails', async function () {
        await accept(user, restId, username, people, date, "15:45", 5, 15,45);
        sleep(timeout);
        await accept(user, restId, username, people, date, "15:00", 5, 14,45);
        sleep(timeout);
        await accept(user, restId, username, people, date, "15:00", 6, 15,00);
        sleep(timeout);
        await fail(user, restId, username, people, date, "15:00");
        sleep(timeout);
    });
    
    it('check if other res are still accepted', async function () {
        await accept(user, restId, username, people, date, "17:00", 3, 17,00);
        sleep(timeout);
        await accept(user, restId, username, people, date, "17:00", 4, 17,00);
        sleep(timeout);
        await accept(user, restId, username, people, date, "16:00", 4, 16,00);
        sleep(timeout);
    });
    
    it('check if res on another day are still accepted', async function () {
        await add(user, restId, username, people, date2, "16:00");
        sleep(timeout);
        await add(user, restId, username, people, date2, "17:00");
        sleep(timeout);
        await accept(user, restId, username, people, date, "17:00", 5, 17,00);
    });
});