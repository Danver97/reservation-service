const uuid = require('uuid/v4');
const repo = require('../../../infrastructure/repository/repositoryManager')('testdb');
const Reservation = require('../../../domain/models/reservation');
const RestaurantReservations = require('../../../domain/models/restaurantReservations');
const testUtils = require('../../test-utils');
const Interactor = require('./utils');

const rr = new RestaurantReservations(uuid(), testUtils.timeTable, testUtils.tables);

function restaurantReservationsCreated() {
    return repo.restaurantReservationsCreated(rr);
}

function reservationCreated() {
    const r = new Reservation(uuid(), rr.restId, 'Gino', 4, new Date(), '15:00');
    return repo.reservationCreated(r);
}

function reservationConfirmed() {
    const r = new Reservation(uuid(), rr.restId, 'Gino', 4, new Date(), '15:00');
    r.accepted(testUtils.tables[4]);
    return repo.reservationConfirmed(r);
}

function reservationCancelled() {
    const r = new Reservation(uuid(), rr.restId, 'Gino', 4, new Date(), '15:00');
    r.cancelled();
    return repo.reservationCancelled(r);
}

function reservationRejected() {
    const r = new Reservation(uuid(), rr.restId, 'Gino', 4, new Date(), '15:00');
    r.rejected();
    return repo.reservationRejected(r);
}

function reservationAdded () {
    const r = new Reservation(uuid(), rr.restId, 'Gino', 4, new Date(), '15:00');
    return repo.reservationRemoved(rr, r);
}
function reservationRemoved() {
    const r = new Reservation(uuid(), rr.restId, 'Gino', 4, new Date(), '15:00');
    return repo.reservationRemoved(rr, r);
}

const p = new Interactor({
    messageProviders: {
        // restaurantReservationsCreated,
        reservationCreated,
        // reservationConfirmed,
        reservationCancelled,
        // reservationRejected,
        reservationAdded,
        // reservationRemoved,
    }
});

describe('Consumers contract test', function () {
    this.slow(5000);
    this.timeout(10000);
    it('verify that published events satisfy consumer contracts expectations', function () {
        return p.verify();
    });
});
