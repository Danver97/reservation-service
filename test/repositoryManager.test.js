const uuid = require('uuid/v4');
const assertStrictEqual = require('../lib/utils').assertStrictEqual;
const Reservation = require('../domain/models/reservation');
const RestaurantReservations = require('../domain/models/restaurantReservations');
const repo = require('../infrastructure/repository/repositoryManager')('testdb');
const ENV = require('../src/env');

describe('RepositoryManager unit test', function() {
    const rr = new RestaurantReservations(uuid());
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

    it('check if reservationAccepted works', async function () {
        res = new Reservation('pippo', 1, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        const rrs = await repo.getReservations(rr.restId);
        rr.reservationAccepted(res);
        rrs.reservationAccepted(res);
        await repo.reservationAccepted(rrs, res);

        const result = await repo.getReservations(rr.restId);
        assertStrictEqual(result, rrs);
    });

    it('check if reservationCancelled works', async function () {
        const rrs = await repo.getReservations(rr.restId);
        rr.reservationCancelled(res.id);
        rrs.reservationCancelled(res.id);
        await repo.reservationCancelled(rrs, res);

        const result = await repo.getReservations(rr.restId);
        assertStrictEqual(result, rrs);
    });

    it('check if reservationFailed works', async function () {
        res2 = new Reservation('pippo3', 1, 'pippo3', 1, tomorrow.toLocaleDateString(), '15:00');
        const rrs = await repo.getReservations(rr.restId);
        rr.reservationFailed(res2);
        rrs.reservationFailed(res2);
        await repo.reservationFailed(rrs, res2);

        const result = await repo.getReservations(rr.restId);
        assertStrictEqual(result, rrs);
    });

    it('check if getReservations works', async function () {
        const result = await repo.getReservations(rr.restId);
        assertStrictEqual(result, rr);
    });
});
