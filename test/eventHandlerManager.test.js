const assert = require('assert');
const broker = require('@danver97/event-sourcing/eventBroker')['testbroker'];
const Event = require('@danver97/event-sourcing/eventBroker/brokerEvent');
const repo = require('../infrastructure/repository/repositoryManager')('testdb');
const manager = require('../domain/logic/restaurantReservationsManager')(repo);
const handlerMgrFunc = require('../infrastructure/messaging/eventHandlerManager');
const Reservation = require('../domain/models/reservation');
const Table = require('../domain/models/table');

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
    new Table(1, 1, 2),
    new Table(2, 1, 3),
    new Table(3, 1, 4),
    new Table(4, 1, 4),
    new Table(5, 1, 4),
    new Table(6, 1, 6),
];

let stopHandler = null;

const waitAsync = ms => new Promise((resolve, reject) => setTimeout(resolve, ms));

describe('eventHandlerManager unit test', function () {
    let res = null;

    before(async () => {
        repo.reset();
        await broker.subscribe('microservice-test');
        stopHandler = handlerMgrFunc(manager, 'testbroker', { number: 10, ms: 10, visibilityTimeout: 5 });
    });

    it('check restaurantReservations creation transaction', async function () {
        const payload = {
            restId: 'asdf',
            owner: 'Giucas Casella',
            timeTable,
            tables, // : [],
        };
        const restaurantCreated = new Event('asdf', 1, 'restaurantCreated', payload);
        await broker.publish(restaurantCreated);
        await waitAsync(50);

        let err = null;
        try {
            await repo.getReservations('asdf')
        } catch (e) {
            err = e;
        }
        assert.doesNotThrow(() => {
            if (err)
                throw err;
        }, Error);
    });

    it('check reservationCreated transaction', async function () {
        const date = new Date();
        date.setHours(date.getHours() + 1);
        const payload = {
            id: 'res1',
            restId: 'asdf',
            status: 'pending',
            statusCode: 0,
            userId: '132456',
            reservationName: 'Antonacci',
            people: 6,
            date: date.toJSON(),
        };
        res = Reservation.fromObject(payload);
        await repo.reservationCreated(res);
        await waitAsync(50);

        const rr = await repo.getReservations('asdf');
        const table = rr.getTables(6)[0];
        res.accepted(table);
        assert.strictEqual(JSON.stringify(table.getReservations()[0]), JSON.stringify(res));

        const result = await repo.getReservation(res.id);
        assert.strictEqual(result.status, 'confirmed');
        assert.strictEqual(result.status, res.status);
        assert.deepStrictEqual(result.table, res.table);
    });

    it('check reservationCancelled transaction', async function () {
        res = await repo.getReservation(res.id);
        await repo.reservationCancelled(res);
        await waitAsync(50);

        const rr = await repo.getReservations('asdf');
        const table = rr.getTables(6)[0];
        assert.strictEqual(JSON.stringify(table.getReservations()[0]), JSON.stringify(undefined));
    });

    after(() => {
        stopHandler();
    });
});
