const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const queryFunc = require('../../infrastructure/query');
const QueryError = require('../../infrastructure/query/query_error');
const Table = require('../../domain/models/table');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const Utils = require('../../lib/utils');

Utils.defineArrayFlat();
Utils.defineArrayFlatMap();

const mongod = new MongoMemoryServer();
let mongodb;
let collection;
let querygetUserReservations;

const timeTable = {
    Monday: '7:00-18:00',
    Tuesday: '7:00-18:00',
    Wednesday: '7:00-18:00',
    Thursday: '7:00-18:00',
    Friday: '7:00-18:00',
    Saturday: '7:00-18:00',
    Sunday: '7:00-18:00',
};
const tables = [
    new Table('1', 1, 2),
    new Table('2', 1, 3),
    new Table('3', 1, 4),
    new Table('4', 1, 4),
    new Table('5', 1, 4),
    new Table('6', 1, 6),
];
const rr = new RestaurantReservations('aaaaaa', timeTable, tables);
const tomorrow = new Date();
tomorrow.setHours(tomorrow.getHours() + 24);
const res = new Reservation('aef2ae', 'aaaaaa', 'Pippo', 4, tomorrow, '15:00');

async function writeSomeData() {
    collection = mongodb.db('Reservation').collection('Reservation');
    res._id = res.id;
    res._revisionId = 1;
    await collection.insertOne(res);

    const rrToWrite = {
        _id: rr.restId,
        restId: rr.restId,
        timeTable: rr.timeTable,
        tables: rr.tables.map(t => JSON.parse(t.toString())),
        reservations: rr.getTables(0).flatMap(t => t.getReservations()).sort((r1, r2) => r1.date.getTime() < r2.date.getTime() ? -1 : 1),
        _revisionId: 1,
    };
    await collection.insertOne(rrToWrite);
}

function assertRestaurantReservationsEqual(actual, expected) {
    assert.strictEqual(actual.restId, expected.restId);
    assert.deepStrictEqual(actual.timeTable, expected.timeTable);
    assert.deepStrictEqual(actual.tables, expected.tables.map(t => JSON.parse(t.toString())));
    const expectedReservations = rr.getTables(0).flatMap(t => t.getReservations()).sort((r1, r2) => r1.date.getTime() < r2.date.getTime() ? -1 : 1);
    assert.deepStrictEqual(actual.reservations, expectedReservations);
}

describe('query unit test', function () {

    before(async function () {
        this.timeout(10000);
        const connString = await mongod.getConnectionString();
        query = await queryFunc(connString, 'Reservation', 'Reservation');
        mongodb = new MongoClient(connString, { useNewUrlParser: true });
        await mongodb.connect();
        await writeSomeData();
    });

    it('check if getReservation() works', async function () {
        assert.throws(() => query.getReservation(), QueryError);
        const doc = await query.getReservation(res.id);
        assert.deepStrictEqual(doc, res);
    });

    it('check if getUserReservations() works', async function () {
        assert.throws(() => query.getUserReservations(), QueryError);
        const docs = await query.getUserReservations(res.userId);
        assert.deepStrictEqual(docs, [res]);
    });

    it('check if getRestaurantReservations() works', async function () {
        assert.throws(() => query.getRestaurantReservations(), QueryError);
        const doc = await query.getRestaurantReservations(rr.restId);
        assertRestaurantReservationsEqual(doc, rr);
    });

    after(async function () {
        await mongodb.close();
        await mongod.stop();
    });

});
