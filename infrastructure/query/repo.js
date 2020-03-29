const Promisify = require('promisify-cb');
const Reservation = require('../../domain/models/reservation');
const QueryError = require('./query_error');

let mongoCollection = null;

function getReservation(id, cb) {
    if (!id)
        throw QueryError.paramError(`Missing the following parameters:${id ? '' : ' id'}`);
    return Promisify(async () => {
        const doc = await mongoCollection.findOne({ _id: id });
        if (!doc)
            throw QueryError.reservationNotFoundError('reservation not found');
        return Reservation.fromObject(doc);
    }, cb);
}

function getUserReservations(userId, cb) {
    if (!userId)
        throw QueryError.paramError(`Missing the following parameters:${userId ? '' : ' userId'}`);
    return Promisify(async () => {
        const docs = await mongoCollection.find({ userId }).toArray();
        return docs.map(d => Reservation.fromObject(d));
    }, cb);
}

function getReservations(restId, cb) {
    if (!restId)
        throw QueryError.paramError(`Missing the following parameters:${restId ? '' : ' restId'}`);
    return Promisify(async () => {
        // const docs = await mongoCollection.findOne({ _id: restId, restId }, { projection: { reservations: 1 } });
        const docs = await mongoCollection.find({ restId, _type: 'reservation' }).toArray();
        if (!docs)
            throw QueryError.reservationsNotFoundError('reservations not found');
        return docs;
    }, cb);
}

function getRestaurantReservations(restId, cb) {
    if (!restId)
        throw QueryError.paramError(`Missing the following parameters:${restId ? '' : ' restId'}`);
    return Promisify(async () => {
        const doc = await mongoCollection.findOne({ _id: restId, restId });
        if (!doc)
            throw QueryError.restaurantReservationsNotFoundError('restaurantReservations document not found');
        return doc;
    }, cb);
}

function exportFunc(mongodbCollection) {
    if (!mongodbCollection)
        throw QueryError.paramError(`Missing the following parameters:${mongodbCollection ? '' : ' mongodbCollection'}`);
    mongoCollection = mongodbCollection;
    return {
        getReservation,
        getUserReservations,
        getReservations,
        getRestaurantReservations,
    };
}

module.exports = exportFunc;
