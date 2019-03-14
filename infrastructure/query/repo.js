const Promisify = require('promisify-cb');
const Reservation = require('../../domain/models/reservation');
const QueryError = require('./query_error');

let mongoCollection = null;

function getReservation(id, cb) {
    if (!id)
        throw new QueryError(`Missing the following parameters:${id ? '' : ' id'}`, QueryError.paramError);
    return Promisify(async () => {
        const doc = await mongoCollection.findOne({ _id: id });
        if (!doc)
            throw new QueryError('Document not found', QueryError.notFound);
        return Reservation.fromObject(doc);
    }, cb);
}

function getUserReservations(userId, cb) {
    if (!userId)
        throw new QueryError(`Missing the following parameters:${userId ? '' : ' userId'}`, QueryError.paramError);
    return Promisify(async () => {
        const docs = await mongoCollection.find({ userId }).toArray();
        return docs.map(d => Reservation.fromObject(d));
    }, cb);
}

function getReservations(restId, cb) {
    if (!restId)
        throw new QueryError(`Missing the following parameters:${restId ? '' : ' restId'}`, QueryError.paramError);
    return Promisify(async () => {
        const docs = await mongoCollection.findOne({ _id: restId, restId }, { projection: { reservations: 1 } });
        if (!docs)
            throw new QueryError('Document not found', QueryError.notFound);
        return docs.reservations;
    }, cb);
}

function getRestaurantReservations(restId, cb) {
    if (!restId)
        throw new QueryError(`Missing the following parameters:${restId ? '' : ' restId'}`, QueryError.paramError);
    return Promisify(async () => {
        const doc = await mongoCollection.findOne({ _id: restId, restId });
        if (!doc)
            throw new QueryError('Document not found', QueryError.notFound);
        return doc;
    }, cb);
}

function exportFunc(mongodbCollection) {
    if (!mongodbCollection)
        throw new QueryError(`Missing the following parameters:${mongodbCollection ? '' : ' mongodbCollection'}`, QueryError.paramError);
    mongoCollection = mongodbCollection;
    return {
        getReservation,
        getUserReservations,
        getReservations,
        getRestaurantReservations,
    };
}

module.exports = exportFunc;
