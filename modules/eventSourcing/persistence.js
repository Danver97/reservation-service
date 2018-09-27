const ENV = require('../../src/env');
const EventBroker = require('./eventBroker');
const EventStore = require('./eventStore');
const Event = require('./event');
const ReservationEvents = require('../reservation-events');

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

function reservationPending(res, cb) {
    const event = new Event(res.restaurantId, ReservationEvents.topic, ReservationEvents.reservationPending, res);
    return publishWithOptionalPromise(event, cb);
}

function reservationAccepted(res, cb) {
    const event = new Event(res.restaurantId, ReservationEvents.topic, ReservationEvents.reservationAccepted, res);
    return publishWithOptionalPromise(event, cb);
}

function reservationFailed(res, cb) {
    const event = new Event(res.restaurantId, ReservationEvents.topic, ReservationEvents.reservationFailed, res);
    return publishWithOptionalPromise(event, cb);
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
}

function getReservation(restId, resId, cb) {
    return store.getReservation(restId, resId, cb);
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
};

module.exports = persistence;
