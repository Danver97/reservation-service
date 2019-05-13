const assert = require('assert');
const uuid = require('uuid/v4');
const Table = require('../domain/models/table');
const Reservation = require('../domain/models/reservation');
const RestaurantReservations = require('../domain/models/restaurantReservations');
const RestaurantReservationsError = require('../domain/errors/restaurantReservations_error');

describe('RestaurantReservations unit test', function () {
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
        new Table(1, 1, 2),
        new Table(2, 1, 3),
        new Table(3, 1, 4),
        new Table(4, 1, 4),
        new Table(5, 1, 4),
        new Table(6, 1, 6),
    ];
    let res;
    const tomorrow = new Date(Date.now());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const id = uuid();
    const rr = new RestaurantReservations(id, timeTable, tables);

    it('check if constructor works', function () {
        assert.throws(() => new RestaurantReservations(), RestaurantReservationsError);
        assert.strictEqual(rr.restId, id);
        assert.strictEqual(JSON.stringify(rr.timeTable), JSON.stringify(timeTable));
    });

    it('check if setTimeTable works', function () {
        assert.throws(() => rr.setTimeTable(), RestaurantReservationsError);
    });

    it('check if setTables works', function () {
        assert.throws(() => rr.setTables(), RestaurantReservationsError);
    });

    it('check if reservationAdded works', function () {
        assert.throws(() => rr.reservationAdded(), RestaurantReservationsError);
        assert.throws(() => rr.reservationAdded({}), RestaurantReservationsError);
        res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        assert.throws(() => rr.reservationAdded(res), RestaurantReservationsError);
        res.accepted(tables[0]);
        rr.reservationAdded(res);
        assert.throws(() => rr.reservationAdded(res), RestaurantReservationsError);
        assert.strictEqual(JSON.stringify(rr.getTables(2)[0].getReservations()), JSON.stringify([res]));
        const res2 = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        res2.cancelled();
        assert.throws(() => rr.reservationAdded(res2), RestaurantReservationsError);
    });

    it('check if reservationRemoved works', function () {
        assert.throws(() => rr.reservationRemoved(), RestaurantReservationsError);
        assert.throws(() => rr.reservationRemoved({}), RestaurantReservationsError);
        rr.reservationRemoved(res.id);
        assert.throws(() => rr.reservationRemoved(res.id), RestaurantReservationsError);
        assert.strictEqual(JSON.stringify(rr.getTables(2)[0].getReservations()), JSON.stringify([]));
    });
});
