const implem = require('./implements');
const ENV = require('../src/env');
const persistence = require('./eventSourcing/persistence');
const testdb = require('./db/testdb');

let dbmanager;
// if (ENV.test === 'dynamodb') dbmanager = require('dynamodb');
if (ENV.node_env === 'test') dbmanager = testdb;
if (ENV.node_env === 'test_event_sourcing') dbmanager = persistence;

const Property = implem.Property;

const interf = {
    getPreviousPendingResCount: new Property('function', 4),
    getPreviousPendingRes: new Property('function', 4),
    getReservationsFromDateToDate: new Property('function', 4),
    getReservations: new Property('function', 2),
    getReservation: new Property('function', 3),
};

implem.checkImplementation(interf, dbmanager);

module.exports = dbmanager;
