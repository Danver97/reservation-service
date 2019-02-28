const assert = require('assert');
const uuid = require('uuid/v4');
const assertStrictEqual = require('../lib/utils').assertStrictEqual;
const Table = require('../domain/models/table');
const Reservation = require('../domain/models/reservation');
const RestaurantReservations = require('../domain/models/restaurantReservations');
const repo = require('../infrastructure/repository/repositoryManager')('testdb');
const ENV = require('../src/env');

function restaurantReservationsEqual(actual, expected) {
    assert.strictEqual(actual.restId, expected.restId);
    assert.strictEqual(JSON.stringify(actual.timeTable), JSON.stringify(expected.timeTable));
    assert.strictEqual(JSON.stringify(actual.reservationsTableId), JSON.stringify(expected.reservationsTableId));
    assert.strictEqual(JSON.stringify(actual.tablesMap), JSON.stringify(expected.tablesMap));
    assert.strictEqual(JSON.stringify(actual.tables), JSON.stringify(expected.tables));
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
    const rr = new RestaurantReservations(uuid(), timeTable, tables);
    let res;
    let res2;

    const tomorrow = new Date(Date.now());
    tomorrow.setDate(tomorrow.getDate() + 1);

    before(() => {
        if (ENV.node_env === 'test' && ENV.event_store === 'testdb')
            repo.reset();
        else if (ENV.node_env === 'test_event_sourcing' && ENV.event_store === 'testdb')
            repo.reset();
    });

    it('check if restaurantReservationsCreated works', async function () {
        await repo.restaurantReservationsCreated(rr);
        const result = await repo.getReservations(rr.restId);
        assertStrictEqual(result, rr);
    });

    it('check if reservationCreated works', async function () {
        res = new Reservation('pippo', 1, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        await repo.reservationCreated(res);
        const result = await repo.getReservation(res.id);
        assertStrictEqual(result, res);
    });

    it('check if reservationConfirmed works', async function () {
        res = await repo.getReservation(res.id);
        res.accepted(tables[0]);
        await repo.reservationConfirmed(res);
        const result = await repo.getReservation(res.id);
        assertStrictEqual(result, res);
    });

    it('check if reservationRejected works', async function () {
        let newRes = new Reservation('pippo', 1, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        await repo.reservationCreated(newRes);
        newRes.rejected();
        await repo.reservationRejected(newRes);
        const result = await repo.getReservation(newRes.id);
        assertStrictEqual(result, newRes);
    });

    it('check if reservationAdded works', async function () {
        const rrs = await repo.getReservations(rr.restId);
        rr.reservationAdded(res);
        rrs.reservationAdded(res);
        await repo.reservationAdded(rrs, res);

        const result = await repo.getReservations(rr.restId);
        assertStrictEqual(JSON.stringify(result.getTables()), JSON.stringify(rrs.getTables()));
    });

    it('check if reservationCancelled works', async function () {
        res = await repo.getReservation(res.id);
        res.cancelled();
        await repo.reservationCancelled(res);
        const result = await repo.getReservation(res.id);
        assertStrictEqual(result, res);
    });

    it('check if reservationRemoved works', async function () {
        const rrs = await repo.getReservations(rr.restId);
        rr.reservationRemoved(res.id);
        rrs.reservationRemoved(res.id);
        await repo.reservationRemoved(rrs, res.id);

        const result = await repo.getReservations(rr.restId);
        assertStrictEqual(result, rrs);
    });

    it('check if getReservations works', async function () {
        try {
            await repo.getReservations('noneid');
        } catch (e) {
            assert.throws(() => { throw e; }, Error);
        }
        const result = await repo.getReservations(rr.restId);
        restaurantReservationsEqual(result, rr);
    });

    it('check if getReservation works', async function () {
        try {
            await repo.getReservation('noneid');
        } catch (e) {
            assert.throws(() => { throw e; }, Error);
        }
    });
});
