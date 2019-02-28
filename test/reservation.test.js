const assert = require('assert');
const Reservation = require('../domain/models/reservation');
const ReservationError = require('../domain/errors/reservation_error');

describe('Reservation class unit test', function () {
    const res = new Reservation('pippo', 1, 'pippo', 4, '2018-07-15', '15:00');
    const d = new Date('2018-07-15');
    d.setHours(15);
    d.setMinutes(0);
    const table = {
        id: 1,
        people: 4,
    };
    const effDate = new Date('2018-07-15');
    effDate.setHours(15);
    effDate.setMinutes(15);

    it('check if Reservation is created with the right attributes', function () {
        assert.throws(() => new Reservation(), ReservationError);
        assert.strictEqual(res.userId, 'pippo');
        assert.strictEqual(res.restId, 1);
        assert.strictEqual(res.reservationName, 'pippo');
        assert.strictEqual(res.people, 4);
        assert.strictEqual(res.date.toLocaleString(), d.toLocaleString());
    });

    it('check if pending() called again throws ReservationError', function () {
        assert.throws(() => res.pending(), ReservationError);
    });

    it('check if accepted() works', function () {
        res.accepted(table, effDate);
        assert.strictEqual(res.table.id, 1);
        assert.strictEqual(res.table.people, 4);
        assert.strictEqual(res.date.toLocaleString(), effDate.toLocaleString());
        assert.throws(() => res.accepted(table, effDate), ReservationError);
    });

    it('check if accepted() called again throws ReservationError', function () {
        assert.throws(() => res.accepted(table, effDate), ReservationError);
    });

    it('check if rejected() called after accepted() throws ReservationError', function () {
        assert.throws(() => res.rejected(), ReservationError);
    });

    it('check if cancelled() works', function () {
        res.cancelled();
        assert.strictEqual(res.status, 'cancelled');
    });

    it('check if cancelled() throws ReservationError', function () {
        assert.throws(() => res.cancelled(), ReservationError);
    });

    it('check if setTable() works', function () {
        assert.throws(() => res.setTable(1, 3), ReservationError);
    });
});
