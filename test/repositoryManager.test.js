const assert = require('assert');
const Reservation = require("../models/reservation");
const repo = require("../modules/repositoryManager");
const ENV = require('../src/env');

describe('RepositoryManager unit test', function () {
    let res, res2, fromDate, toDate;
    let tomorrow = new Date(Date.now());
    tomorrow.setDate(tomorrow.getDate()+1);
    it('check if addReservation() works', async function () {
        if(ENV.test === 'true')
            repo.reset();
        res = new Reservation("pippo", 1, "pippo", 1, tomorrow.toLocaleDateString(), "15:00");
        res.pending();
        await repo.save(res);
        filterDate = new Date(res.created.getTime());
        filterDate.setMinutes(filterDate.getMinutes() + 1);
        const count = await repo.getPreviousPendingResCount(1, filterDate, res.date)
        assert.strictEqual(count, 1);
    });

    it('check if pending res are correctly inserted with right attributes', async function () {
        res2 = new Reservation("pippo2", 1, "pippo", 2, tomorrow.toLocaleDateString(), "15:00");
        res2.pending();
        await repo.save(res2);
        filterDate = new Date(res2.created.getTime());
        filterDate.setMinutes(filterDate.getMinutes() + 1);
        assert.strictEqual(JSON.stringify(await repo.getPreviousPendingRes(1, filterDate, res.date)), JSON.stringify({"0":0, "1":1, "2":2}));
    });

    it('check if accepted res are inserted and found by getReservationsFromDateToDate()', async function () {
        res2.accepted({id: 1, people:4}, null);
        await repo.save(res2);

        fromDate = new Date(res2.date.getTime());
        fromDate.setHours(fromDate.getHours()-1);
        toDate = new Date(res2.date.getTime());
        toDate.setHours(toDate.getHours()+1);

        const result = await repo.getReservationsFromDateToDate(1, fromDate, toDate);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(JSON.stringify(result),JSON.stringify([res2]));
    });

    it('check if accepted res are inserted and found by getReservations()', async function () {
        assert.strictEqual(JSON.stringify(await repo.getReservations(res2.restaurantId)), JSON.stringify([res2]));
        assert.strictEqual(JSON.stringify(await repo.getPreviousPendingRes(1, filterDate, res.date)), JSON.stringify({"0":0, "1":1}));
    });

    it('check if another accepted res is inserted, found and counted', async function () {
        res.accepted({id: 2, people:4}, null);
        await repo.save(res);
        assert.strictEqual(JSON.stringify(await repo.getPreviousPendingRes(1, filterDate, res.date)), JSON.stringify({"0":0}));
        assert.strictEqual((await repo.getReservationsFromDateToDate(1, fromDate, toDate)).length, 2);
    });
});