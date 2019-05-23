const Promisify = require('promisify-cb');

const dependencies = {
    db: null,
};

function reservationCreated(e, cb) {
    return Promisify(async () => {
        const reservation = e.payload;
        await dependencies.db.reservationCreated(reservation);
    }, cb);
}

function reservationConfirmed(e, cb) {
    return Promisify(async () => {
        const resId = e.payload.resId;
        await dependencies.db.reservationConfirmed(resId, e.eventId - 1, e.payload);
    }, cb);
}

function reservationRejected(e, cb) {
    return Promisify(async () => {
        const resId = e.payload.resId;
        const status = e.payload.status;
        await dependencies.db.reservationRejected(resId, e.eventId - 1, status);
    }, cb);
}

function reservationCancelled(e, cb) {
    return Promisify(async () => {
        const resId = e.payload.resId;
        const status = e.payload.status;
        await dependencies.db.reservationCancelled(resId, e.eventId - 1, status);
    }, cb);
}

function restaurantReservationsCreated(e, cb) {
    return Promisify(async () => {
        const rr = e.payload;
        await dependencies.db.restaurantReservationsCreated(rr);
    }, cb);
}

function reservationAdded(e, cb) {
    return Promisify(async () => {
        const restId = e.streamId;
        const reservation = e.payload;
        await dependencies.db.reservationAdded(restId, e.eventId - 1, reservation);
    }, cb);
}

function reservationRemoved(e, cb) {
    return Promisify(async () => {
        const restId = e.payload.restId;
        const resId = e.payload.resId;
        await dependencies.db.reservationRemoved(restId, e.eventId - 1, resId);
    }, cb);
}

const handlersMap = {
    reservationCreated,
    reservationConfirmed,
    reservationRejected,
    reservationCancelled,
    restaurantReservationsCreated,
    reservationAdded,
    reservationRemoved,
};

async function handler(e, ack) {
    if (!e)
        return;
    if (typeof handlersMap[e.message] === 'function') {
        await handlersMap[e.message](e);
        if (typeof ack === 'function')
            await ack();
    }
}

function exportFunc(db) {
    dependencies.db = db;
    return handler;
}

module.exports = exportFunc;
