const implem = require('../../lib/implements');
const ENV = require('../../src/env');
const repoImpl = require('./repo');
const dbs = require('../../lib/eventSourcing/eventStore');

const Property = implem.Property;

const interf = {
    getPreviousPendingResCount: new Property('function', 4),
    getPreviousPendingRes: new Property('function', 4),
    getReservationsFromDateToDate: new Property('function', 4),
    getReservations: new Property('function', 2),
    getReservation: new Property('function', 3),
};

function exportFunc(db) {
    let repo;
    if (!db)
        repo = repoImpl(dbs[ENV.event_store]);
    else
        repo = repoImpl(dbs[db]);
    implem.checkImplementation(interf, repo);
    return repo;
}

module.exports = exportFunc;
