const ENV = require('../../src/env');
const EventBroker = require('./eventBroker');
const EventStore = require('./eventStore');
const Event = require('./event');
const ReservationEvents = require('../reservation-events');
const Reservation = require('../../models/reservation');
const Promisify = require('../../lib/utils').promisify;

let broker;
let store;

if (ENV.node_env === 'test' || ENV.event_broker === ENV.event_store) {
    store = EventStore();
    broker = store;
} else {
    broker = EventBroker;
    store = EventStore(EventBroker);
    broker.subscribe(ReservationEvents.topic);
}

// Event publishers
// rst
function publishWithOptionalPromise(event, cb) {
    const result = new Promise(async (resolve, reject) => {
        try {
            await broker.publishEvent(event);
            if (cb)
                cb(null, event);
            resolve(event);
        } catch (e) {
            if (cb)
                cb(e);
            reject(e);
        }
    });
    if (cb)
        return null;
    return result;
}

function reservationPending(restId, payload, cb) {
    const event = new Event(restId, ReservationEvents.topic, ReservationEvents.reservationPending, payload);
    return publishWithOptionalPromise(event, cb);
}

function reservationAccepted(restId, payload, cb) {
    const event = new Event(restId, ReservationEvents.topic, ReservationEvents.reservationAccepted, payload);
    return publishWithOptionalPromise(event, cb);
}

function reservationFailed(restId, payload, cb) {
    const event = new Event(restId, ReservationEvents.topic, ReservationEvents.reservationFailed, payload);
    return publishWithOptionalPromise(event, cb);
}

function getTables(restId, cb) {
    return store.getTables(restId, cb);
}

function getPreviousPendingResCount(restId, created, date, cb) {
    return store.getPreviousPendingResCount(restId, created, date, cb);
}

function getPreviousPendingRes(restId, created, date, cb) {
    return store.getPreviousPendingRes(restId, created, date, cb);
}

function getReservationsFromDateToDate(restId, fromDate, toDate, cb) {
    return store.getReservationsFromDateToDate(restId, fromDate, toDate, cb);
}

function getReservations(restId, cb) {
    return store.getReservations(restId, cb);
    return Promisify(async () => {
        const result = await store.getReservations(restId);
        const reservations = result.map(r => Reservation.fromObject(r));
        return reservations;
    }, cb);
}

function getReservation(restId, resId, cb) {
    return Promisify(async () => {
        const res = await store.getReservation(restId, resId);
        const reservation = Reservation.fromObject(res);
        return reservation;
    }, cb);
}
// rcl

const persistence = {
    broker,
    store,
    // db handlers
    reservationPending,
    reservationAccepted,
    reservationFailed,
    getPreviousPendingResCount,
    getPreviousPendingRes,
    getReservationsFromDateToDate,
    getReservations,
    getReservation,
    getTables,
};

module.exports = persistence;
