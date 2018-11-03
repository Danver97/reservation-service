const assert = require('assert');
const request = require('supertest');
const app = require('../src/app');
const ENV = require('../src/env');
const Reservation = require('../models/reservation');
const reservationMgr = require('../modules/reservationManager');
const repo = require('../modules/repositoryManager');

const req = request(app);

const waitAsync = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));
const waitAsyncTimeout = 20;

describe('Integration test', function() {
    
    const reservationEquals = (result, expected) => {
        for(p in expected) {
            if(p === 'date' || p === 'created')
                assert.strictEqual(result[p].getTime(), expected[p].getTime());
            else
                assert.strictEqual(result[p], expected[p]);
        }
    }
    
    before(() => {
        if (ENV.node_env === 'test')
            repo.reset();
        else if (ENV.node_env === 'test_event_sourcing')
            repo.store.reset();
    });
   
    it('get /', async function() {
        await req
        .get('/')
        .expect(JSON.stringify({
            service: 'reservation-service',
        }));
    });
    
    context('Context: Reservation {userId: 15, restaurantId: 1, reservationName: \'Pippo\', people: 4, date: \'2018-12-08\', hour: \'15:00\'}',
            function () {
        const date = '2018-12-08';
        const hour = '15:00';
        const resrv = new Reservation(15, 1, 'Pippo', 4, '2018-12-08', '15:00');
        let resArr = [];
        
        it('post /reservation', async function() {
            await waitAsync(waitAsyncTimeout);
            await req
            .post('/reservation')
            .set('Content-Type', 'application/x-www-url-encoded')
            .type('form')
            .send({userId: resrv.userId})
            //.expect(JSON.stringify({}))
            .expect(500);
            await req
            .post('/reservation')
            .set('Content-Type', 'application/x-www-url-encoded')
            .type('form')
            .send({userId: resrv.userId})
            .send({restId: resrv.restaurantId})
            .send({reservationName: resrv.reservationName})
            .send({people: resrv.people})
            .send({date})
            .send({hour})
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
                response.people = parseInt(response.people);
                response.userId = parseInt(response.userId);
                response.restaurantId = parseInt(response.restaurantId);
                reservationEquals(response, resrv);
            })
            .expect(200);
        });
        
        it('get /reservations?restId=1', async function() {
            await waitAsync(waitAsyncTimeout);
            await req
            .get('/reservations')
            .expect(500);
            await req
            .get('/reservations?restId=10')
            .expect(500);
            await reservationMgr.acceptReservation(resrv);
            await waitAsync(waitAsyncTimeout);
            await req
            .get('/reservations?restId=1')
            .expect(res => {
                const response = res.body[0];
                response.created = new Date(response.created);
                response.date = new Date(response.date);
                response.people = parseInt(response.people);
                response.userId = parseInt(response.userId);
                response.restaurantId = parseInt(response.restaurantId, 10);
                assert.strictEqual(res.body.length, 1);
                reservationEquals(response, resrv);
            })
            .expect(200);
        });
    });
});
