const assert = require('assert');
const broker = require('@danver97/event-sourcing/eventBroker')['testbroker'];
const Event = require('@danver97/event-sourcing/eventBroker/brokerEvent');
const eventsChekerUtil = require('@danver97/service-events');
const repo = require('../infrastructure/repository/repositoryManager')('testdb');
const manager = require('../domain/logic/restaurantReservationsManager')(repo);
const brokerHandlerFunc = require('../infrastructure/messaging/eventHandler/brokerHandler');
const Reservation = require('../domain/models/reservation');
const Table = require('../domain/models/table');

const checkEventByPath = eventsChekerUtil.checkByPath;
const Paths = eventsChekerUtil.paths;

const dayTimeTable = {
    morning: {
        open: "11:00",
        close: "14:00"
    },
    afternoon: {
        open: "18:00",
        close: "23:00"
    },
};
const timeTable = {
    Monday: dayTimeTable,
    Tuesday: dayTimeTable,
    Wednesday: dayTimeTable,
    Thursday: dayTimeTable,
    Friday: dayTimeTable,
    Saturday: dayTimeTable,
    Sunday: dayTimeTable,
};
const tables = [
    new Table('1', 1, 2),
    new Table('2', 1, 3),
    new Table('3', 1, 4),
    new Table('4', 1, 4),
    new Table('5', 1, 4),
    new Table('6', 1, 6),
];

const waitAsyncTimeout = 50;
const pollInterval = 10;

let pollId = null;

const waitAsync = ms => new Promise((resolve, reject) => setTimeout(resolve, ms));

describe('eventHandlerManager unit test', function () {
    let res = null;

    before(async () => {
        repo.reset();
        await broker.subscribe('microservice-test');
        brokerHandler = brokerHandlerFunc(manager, broker);
        const pollOptions = { number: 10, ms: pollInterval, visibilityTimeout: 5 };
        pollId = broker.startPoll(pollOptions, brokerHandler, pollOptions.ms);
    });

    it('check restaurantReservations creation transaction', async function () {
        const payload = {
            restId: 'asdf',
            owner: 'Giucas Casella',
            timeTable,
            tables, // : [],
        };
        const restaurantCreated = new Event('asdf', 1, 'restaurantCreated', payload);
        checkEventByPath(Paths.restaurant_catalog.RESTAURANT_CREATED, restaurantCreated);
        await broker.publish(restaurantCreated);
        await waitAsync(waitAsyncTimeout);

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
        await waitAsync(waitAsyncTimeout);

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
        await waitAsync(waitAsyncTimeout);

        const rr = await repo.getReservations('asdf');
        const table = rr.getTables(6)[0];
        assert.strictEqual(JSON.stringify(table.getReservations()[0]), JSON.stringify(undefined));
    });

    after(() => {
        broker.stopPoll(pollId);
    });
});
