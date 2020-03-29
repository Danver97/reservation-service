const mongodb = require('mongodb');
const Promisify = require('promisify-cb');
const writerFunc = require('./writer');

let writer = null;

class Writer {
    constructor(url, dbName, collectionName) {
        if (!url || !dbName || !collectionName) {
            throw new Error(`WriterError: missing one of the following parameter in the constructor:
            ${url ? '' : 'url'}
            ${dbName ? '' : 'dbName'}
            ${collectionName ? '' : 'collectionName'}`);
        }
        this.url = url;
        this.dbName = dbName;
        this.collectionName = collectionName;
        // useUnifiedTopology: true necessario per mongodb by Bitnami. Not sure if really necessary.
        this.client = new mongodb.MongoClient(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    async connect() {
        if (this.client.isConnected())
            return;
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        this.collection = this.db.collection(this.collectionName);
    }

    get isConnected() {
        return this.client.isConnected();
    }

    closeConnection() {
        return this.client.close();
    }

    async close() {
        await this.closeConnection();
    }

    async disconnect() {
        await this.closeConnection();
    }

    /**
     * Ensure client is connected before proceding to sending write operations to the database
     * @param {function} operationCallback Write operation callback
     * @param {Writer~writerCallback} cb Callback for operation callback result
     */
    writeOperation(operationCallback, cb) {
        return Promisify(async () => {
            await this.connect();
            const result = operationCallback();
            if (result instanceof Promise)
                return await result;
            return result;
        }, cb);
    }

    reservationCreated(reservation, cb) {
        reservation._id = reservation.resId;
        return Promisify(async () => {
            await this.collection.insertOne(reservation);
        }, cb);
    }

    reservationConfirmed(resId, _revisionId, payload, cb) {
        const status = payload.status;
        const table = payload.table;
        return Promisify(async () => {
            const update = { $set: { status } };
            if (table)
                update.$set.table = { id: table.id, people: table.people };
            await this.collection.updateOne({ _id: resId }, update);
        }, cb);
    }

    reservationRejected(resId, _revisionId, status, cb) {
        return Promisify(async () => {
            await this.collection.updateOne({ _id: resId }, { $set: { status } });
        }, cb);
    }

    reservationCancelled(resId, _revisionId, status, cb) {
        return Promisify(async () => {
            await this.collection.updateOne({ _id: resId }, { $set: { status } });
        }, cb);
    }

    restaurantReservationsCreated(restaurantReservations, cb) {
        restaurantReservations._id = restaurantReservations.restId;
        restaurantReservations._revisionId = 1;
        restaurantReservations.reservations = [];
        return Promisify(() => this.collection.insertOne(restaurantReservations), cb);
    }

    /* reservationAdded(restId, _revisionId, reservation, cb) {
        return Promisify(() => this.collection.updateOne(
            { _id: restId },
            { $push: { reservations: { $each: [reservation], $sort: { date: 1 } } } },
        ), cb);
    }

    reservationRemoved(restId, _revisionId, resId, cb) {
        return Promisify(() => this.collection.updateOne(
            { _id: restId },
            { $pull: { reservations: { resId } } }
        ), cb);
    } */
}

/**
 * @callback Writer~writerCallback
 * @param {object} error Error object
 * @param {any} response Response of the operation
 */

/**
 * Export function for the writer singleton object
 * @param {object} options Export function options
 * @param {object} options.url Url string for the mongodb instance
 * @param {object} options.db Db name of the db
 * @param {object} options.collection Collection name of the db's collection to write to
 */
async function exportFunc(options) {
    function areSameOptions(options) {
        return options.url === writer.url && options.db === writer.dbName && options.collection === writer.collectionName;
    }

    if (!options || (writer && writer.isConnected && areSameOptions(options)))
        return writer;
    writer = new Writer(options.url, options.db, options.collection);
    await writer.connect();
    return writer;
}

module.exports = exportFunc;
