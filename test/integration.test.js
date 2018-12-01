const assert = require('assert');
const request = require('supertest');
const app = require('../src/app');
const ENV = require('../src/env');
const Reservation = require('../domain/models/reservation');
const RestaurantReservations = require('../domain/models/restaurantReservations');
const repo = require('../infrastructure/repository/repositoryManager')();
const reservationMgr = require('../domain/logic/restaurantReservationsManager')(repo);

const req = request(app);

const waitAsync = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));
const waitAsyncTimeout = 10;

describe('Integration test', function() {
    const rr1 = new RestaurantReservations(1);
    const rr2 = new RestaurantReservations(2);
    
    const reservationEquals = (result, expected) => {
        for(let p in expected) {
            if (p === 'id')
                continue;
            if (p === 'date' || p === 'created')
                assert.strictEqual(result[p].getTime(), expected[p].getTime());
            else
                assert.strictEqual(result[p], expected[p]);
        }
    };
    
    before(async () => {
        if (ENV.node_env === 'test' && ENV.event_store === 'testdb')
            repo.reset();
        else if (ENV.node_env === 'test_event_sourcing' && ENV.event_store === 'testdb')
            repo.reset();
        await repo.restaurantReservationsCreated(rr1);
        await repo.restaurantReservationsCreated(rr2);
    });
   
    it('get /', async function() {
        await req
            .get('/')
            .expect(JSON.stringify({
                service: 'reservation-service',
            }));
    });
    
    context('Context: Reservation {userId: 15, restaurantId: 1, reservationName: \'Pippo\', people: 4, date: \'2018-12-08\', hour: \'15:00\'}', function () {
        const date = '2018-12-08';
        const hour = '15:00';
        const resrv = new Reservation(15, 1, 'Pippo', 4, '2018-12-08', '15:00');

        it('post /reservation', async function() {
            await waitAsync(waitAsyncTimeout);
            await req
                .post('/reservation')
                .set('Content-Type', 'application/x-www-url-encoded')
                .type('form')
                .send({ userId: resrv.userId })
                // .expect(JSON.stringify({}))
                .expect(500);
            await req
                .post('/reservation')
                .set('Content-Type', 'application/x-www-url-encoded')
                .type('form')
                .send({ userId: resrv.userId })
                .send({ restId: resrv.restaurantId })
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

        /*
        it('get /reservation?restId=1&resId=' + resrv.id, async function() {
            await waitAsync(waitAsyncTimeout);
            await req
                .get('/reservation?restId=1')
                .expect(500);
            await req
                .get('/reservation')
                .expect(500);
            await req
                .get('/reservation?restId=1&resId=18')
                .expect(500);
            await req
                .get('/reservation?restId=1&resId=' + resrv.id)
                .expect(res => {
                    const response = res.body;
                    response.created = new Date(response.created);
                    resrv.created = response.created;
                    response.status = undefined;
                    response.tableId = undefined;
                    response.tablePeople = undefined;
                    response.date = new Date(response.date);
                    response.people = parseInt(response.people, 10);
                    response.userId = parseInt(response.userId, 10);
                    response.restaurantId = parseInt(response.restaurantId, 10);
                    reservationEquals(response, resrv);
                })
                .expect(200);
        });
        */

        it('get /reservations?restId=1', async function() {
            await waitAsync(waitAsyncTimeout);
            await req
                .get('/reservations')
                .expect(500);
            await req
                .get('/reservations?restId=10')
                .expect(500);
            
            const reservation = new Reservation(15, 2, 'Pippo2', 4, '2018-12-09', '15:00');
            await reservationMgr.acceptReservation(reservation.restaurantId, reservation);
            
            await waitAsync(waitAsyncTimeout);
            await req
                .get(`/reservations?restId=${reservation.restaurantId}`)
                .expect(res => {
                    const response = res.body[0];
                    response.created = new Date(response.created);
                    response.date = new Date(response.date);
                    response.people = parseInt(response.people, 10);
                    response.userId = parseInt(response.userId, 10);
                    response.restaurantId = parseInt(response.restaurantId, 10);
                    assert.strictEqual(res.body.length, 1);
                    reservationEquals(response, reservation);
                })
                .expect(200);
        });
    });
});
