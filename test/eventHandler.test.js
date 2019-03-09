const assert = require('assert');
const Event = require('@danver97/event-sourcing/event');
const eventsChekerUtil = require('@danver97/service-events');
const repo = require('../infrastructure/repository/repositoryManager')('testdb');
const manager = require('../domain/logic/restaurantReservationsManager')(repo);
const handler = require('../infrastructure/messaging/eventHandler')(manager);
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

describe('eventHandler unit test', function () {
    let res = null;

    before(() => {
        repo.reset();
    });

    it('check if restaurantCreated is handled properly', async function () {
        const payload = {
            restId: 'asdf',
            owner: 'Giucas Casella',
            timeTable,
            tables, // : [],
        };
        const restaurantCreated = new Event('asdf', 1, 'restaurantCreated', payload);
        checkEventByPath(Paths.restaurant_catalog.RESTAURANT_CREATED, restaurantCreated);
        await handler(restaurantCreated);
        assert.doesNotThrow(async () => await repo.getReservations('asdf'), Error);
    });

    it('check if reservationCreated is handled properly', async function () {
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
        const reservationCreated = new Event('res1', 1, 'reservationCreated', payload);
        checkEventByPath(Paths.reservation.RESERVATION_CREATED, reservationCreated);
        await handler(reservationCreated);
        const rr = await repo.getReservations('asdf');
        const table = rr.getTables(6)[0];
        res.accepted(table);
        assert.strictEqual(JSON.stringify(table.getReservations()[0]), JSON.stringify(res));
    });

    it('check if reservationAdded is handled properly', async function () {
        const payload = {
            id: res.id,
            userId: res.userId,
            date: res.date.toLocaleDateString(),
            people: res.people,
            table: res.table,
        };
        const reservationAdded = new Event('asdf', 1, 'reservationAdded', payload);
        checkEventByPath(Paths.reservation.RESERVATION_ADDED, reservationAdded);
        await handler(reservationAdded);
        const result = await repo.getReservation(res.id);
        assert.strictEqual(result.status, 'confirmed');
        assert.strictEqual(result.status, res.status);
        assert.deepStrictEqual(result.table, res.table);
    });

    it('check if reservationCancelled is handled properly', async function () {
        const payload = {
            resId: res.id,
            restId: res.restId,
            status: 'cancelled',
        };
        const reservationCancelled = new Event(res.id, 1, 'reservationCancelled', payload);
        checkEventByPath(Paths.reservation.RESERVATION_CANCELLED, reservationCancelled);
        await handler(reservationCancelled);
        const rr = await repo.getReservations('asdf');
        const table = rr.getTables(6)[0];
        assert.strictEqual(JSON.stringify(table.getReservations()[0]), JSON.stringify(undefined));
    });
});
