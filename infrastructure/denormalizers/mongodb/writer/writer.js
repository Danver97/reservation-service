const Promisify = require('promisify-cb');

const dependencies = {
    db: null,
    collection: null,
};

function reservationCreated(reservation, cb) {
    reservation._id = reservation.id;
    reservation._revisionId = 1;
    return Promisify(async () => {
        await dependencies.collection.insertOne(reservation);
    }, cb);
}

function reservationConfirmed(resId, _revisionId, payload, cb) {
    const status = payload.status;
    const table = payload.table;
    return Promisify(async () => {
        const update = { $set: { status }, $inc: { _revisionId: 1 } };
        if (table)
            update.$set.table = { id: table.id, people: table.people };
        await dependencies.collection.updateOne({ _id: resId, _revisionId }, update);
    }, cb);
}

function reservationRejected(resId, _revisionId, status, cb) {
    return Promisify(async () => {
        await dependencies.collection.updateOne({ _id: resId, _revisionId }, { $set: { status }, $inc: { _revisionId: 1 } });
    }, cb);
}

function reservationCancelled(resId, _revisionId, status, cb) {
    return Promisify(async () => {
        await dependencies.collection.updateOne({ _id: resId, _revisionId }, { $set: { status }, $inc: { _revisionId: 1 } });
    }, cb);
}

function restaurantReservationsCreated(restaurantReservations, cb) {
    restaurantReservations._id = restaurantReservations.restId;
    restaurantReservations._revisionId = 1;
    restaurantReservations.reservations = [];
    return Promisify(() => dependencies.collection.insertOne(restaurantReservations), cb);
}

function reservationAdded(restId, _revisionId, reservation, cb) {
    return Promisify(() => dependencies.collection.updateOne(
        { _id: restId, _revisionId },
        { $push: { reservations: { $each: [reservation], $sort: { date: 1 } } }, $inc: { _revisionId: 1 } },
    ), cb);
}

function reservationRemoved(restId, _revisionId, resId, cb) {
    return Promisify(async () => {
        dependencies.collection.updateOne({ _id: restId, _revisionId }, { $pull: { reservations: { id: resId } }, $inc: { _revisionId: 1 } });
    }, cb);
}

const exportObj = {
    reservationCreated,
    reservationConfirmed,
    reservationRejected,
    reservationCancelled,
    restaurantReservationsCreated,
    reservationAdded,
    reservationRemoved,
};

function exportFunc(db) {
    dependencies.db = db;
    dependencies.collection = db.collection('Reservation');
    return exportObj;
}

module.exports = exportFunc;
