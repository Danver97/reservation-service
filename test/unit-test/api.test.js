const assert = require('assert');
const request = require('supertest');
const MongoClient = require('mongodb').MongoClient;
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;

const ENV = require('../../src/env');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const Table = require('../../domain/models/table');
const repo = require('../../infrastructure/repository/repositoryManager')();
const reservationMgr = require('../../domain/logic/restaurantReservationsManager')(repo);
const queryManagerFunc = require('../../infrastructure/query');
const appFunc = require('../../infrastructure/api/api');
const Utils = require('../../lib/utils');

Utils.defineArrayFlatMap();

const mongod = new MongoMemoryServer();
let mongodb;
let collection;
let queryMgr;
let app;
let req;

const waitAsync = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));
const waitAsyncTimeout = 1;

let timeTable = {
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

const rr1 = new RestaurantReservations('1', timeTable, tables);
const rr2 = new RestaurantReservations('2', timeTable, tables);

async function writeRes(reservation) {
    reservation._id = reservation.id;
    reservation._revisionId = 1;
    await collection.insertOne(reservation);
}
function rrToMongoDoc(rr) {
    return {
        _id: rr.restId,
        restId: rr.restId,
        timeTable: rr.timeTable,
        tables: rr.tables.map(t => JSON.parse(t.toString())),
        reservations: rr.getTables(0).flatMap(t => t.getReservations()).sort((r1, r2) => r1.date.getTime() < r2.date.getTime() ? -1 : 1),
        _revisionId: 1,
    };
}
async function writeRR(rr) {
    const rrToWrite = rrToMongoDoc(rr);
    await collection.insertOne(rrToWrite);
}
function resToBeAdded(res, table) {
    return {
        id: res.id,
        userId: res.id,
        date: res.date,
        people: res.people,
        table: {
            id: table.id,
            people: table.people,
        },
    };
}
async function addResToRR(rr, res, table) {
    const reservation = resToBeAdded(res, table);
    await collection.updateOne(
        { _id: rr.restId, restId: rr.restId },
        { $push: { reservations: { $each: [reservation], $sort: { date: 1 } } }, $inc: { _revisionId: 1 } },
    );
}

async function setUpEventStore() {
    repo.reset();
    await repo.restaurantReservationsCreated(rr1);
    await repo.restaurantReservationsCreated(rr2);
}
async function setUpMongo() {
    const connString = await mongod.getConnectionString();
    mongodb = new MongoClient(connString, { useNewUrlParser: true });
    await mongodb.connect();
    collection = mongodb.db('Reservation').collection('Reservation');
}
async function setUpQuery() {
    const connString = await mongod.getConnectionString();
    queryMgr = await queryManagerFunc(connString, 'Reservation', 'Reservation');
}
function setUpRequest() {
    app = appFunc(reservationMgr, queryMgr)
    req = request(app);
}


describe('API unit test', function() {
    const reservationEquals = (result, expected) => {
        for(let p in expected) {
            if (p === 'id' || p === 'resId')
                continue;
            if (p === 'date')
                assert.strictEqual(result[p].getTime(), expected[p].getTime());
            else
                assert.strictEqual(result[p], expected[p]);
        }
    };

    before(async () => {
        await setUpEventStore();
        await setUpMongo();
        await setUpQuery();
        setUpRequest();
    });

    it('get /reservation-service', async function() {
        await req
            .get('/reservation-service')
            .expect(JSON.stringify({
                service: 'reservation-service',
            }));
    });

    context('Context: Reservation {userId: \'15\', restaurantId: \'1\', reservationName: \'Pippo\', people: 4, date: \'2018-12-08\', hour: \'15:00\'}', function () {
        const date = '2018-12-08';
        const hour = '15:00';
        const resrv = new Reservation('15', '1', 'Pippo', 4, '2018-12-08', '15:00');

        it('post /reservation-service/reservations', async function() {
            await req
                .post('/reservation-service/reservations')
                .set('Content-Type', 'application/x-www-url-encoded')
                .type('form')
                .send({ userId: resrv.userId })
                .expect(400);
            await req
                .post('/reservation-service/reservations')
                .set('Content-Type', 'application/x-www-url-encoded')
                .type('form')
                .send({ userId: resrv.userId })
                .send({ restId: 'noRestaurantReservationsId' })
                .send({ reservationName: resrv.reservationName })
                .send({ people: resrv.people })
                .send({ date })
                .send({ hour })
                .expect(400);
            await req
                .post('/reservation-service/reservations')
                .set('Content-Type', 'application/x-www-url-encoded')
                .type('form')
                .send({ userId: resrv.userId })
                .send({ restId: resrv.restId })
                .send({ reservationName: resrv.reservationName })
                .send({ people: resrv.people })
                .send({ date })
                .send({ hour })
                .expect(res => {
                    const response = res.body;
                    assert.strictEqual(response.message, 'success');
                    assert.doesNotThrow(() => {
                        resrv.id = response.resId;
                        if(!response.resId)
                            throw new Error('No resId');
                    }, Error);
                })
                .expect(200);
        });

        it('get /reservation-service/reservations/' + resrv.id, async function() {
            await writeRes(resrv);
            await req
                .get('/reservation-service/reservations/')
                .expect(400);
            await req
                .get('/reservation-service/reservations/18')
                .expect(404);
            await req
                .get('/reservation-service/reservations/' + resrv.id)
                .expect(res => {
                    const response = res.body;
                    response.date = new Date(response.date);
                    response.people = parseInt(response.people, 10);
                    reservationEquals(response, resrv);
                })
                .expect(200);
        });

        it('get /reservation-service/reservations?restId=1', async function() {
            await writeRR(rr1);
            await addResToRR(rr1, resrv, tables[0]);

            await req
                .get('/reservation-service/reservations')
                .expect(400);
            await req
                .get('/reservation-service/reservations?restId=10')
                .expect(404);

            await req
                .get(`/reservation-service/reservations?restId=${resrv.restId}`)
                .expect(res => {
                    assert.strictEqual(Array.isArray(res.body), true);
                    assert.strictEqual(res.body.length, 1);
                    const response = res.body[0];
                    response.date = new Date(response.date);
                    response.people = parseInt(response.people, 10);
                    const expected = resToBeAdded(resrv, tables[0]);
                    assert.deepStrictEqual(response, expected);
                })
                .expect(200);
        });
    });

    after(async () => {
        await mongodb.close();
        await mongod.stop();
    })
});
