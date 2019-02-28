const assert = require('assert');
const Reservation = require('../../domain/models/reservation');
const ReservationError = require('../../domain/errors/reservation_error');

var passed = false;

if (process.env.NODE_ENV_TEST === 'mytest') {
    try {
        var res = new Reservation('pippo', 1, 'pippo', 4, '2018-07-15', '15:00');
        assert.strictEqual(res.userId, 'pippo');
        assert.strictEqual(res.restId, 1);
        assert.strictEqual(res.reservationName, 'pippo');
        assert.strictEqual(res.people, 4);
        let d = new Date('2018-07-15');
        d.setHours(15);
        d.setMinutes(0);
        assert.strictEqual(res.date.toLocaleString(), d.toLocaleString());

        res.pending();
        assert.strictEqual(res.status, 'pending');
        assert.throws(() => {res.pending();}, ReservationError);

        let effDate = new Date('2018-07-15');
        effDate.setHours(15);
        effDate.setMinutes(15);
        let table = {
            id: 1,
            people: 4
        }
        res.accepted(table, effDate);
        assert.strictEqual(res.tableId, 1);
        assert.strictEqual(res.tablePeople, 4);
        assert.strictEqual(res.date.toLocaleString(), effDate.toLocaleString());
        assert.throws(() => {res.accepted(table, effDate);}, ReservationError);

        passed = true;
    } catch (err) {
        console.log(err);
        passed = false;
    }
}

module.exports = {success: passed};
