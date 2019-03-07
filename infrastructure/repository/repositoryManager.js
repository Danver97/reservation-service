const dbs = require('@danver97/event-sourcing/eventStore');
const implem = require('implemented');
const ENV = require('../../src/env');
const repoImpl = require('./repo');

const Property = implem.Property;

const interf = {
    restaurantReservationsCreated: new Property('function', 2),
    reservationFailed: new Property('function', 3),
    reservationAccepted: new Property('function', 3),
    reservationCancelled: new Property('function', 3),
    getReservations: new Property('function', 2),

    // getPreviousPendingResCount: new Property('function', 4),
    // getPreviousPendingRes: new Property('function', 4),
    // getReservationsFromDateToDate: new Property('function', 4),
    // getReservation: new Property('function', 3),
};

function exportFunc(db) {
    let repo;
    if (!db)
        repo = repoImpl(dbs[ENV.event_store]);
    else
        repo = repoImpl(dbs[db]);
    console.log(`Repo started with: ${db || ENV.event_store}`);
    // implem.checkImplementation(interf, repo);
    return repo;
}

module.exports = exportFunc;
