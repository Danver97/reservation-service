const assert = require('assert');
const uuid = require('uuid/v4');
const Table = require('../../domain/models/table');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const RestaurantReservationsError = require('../../domain/errors/restaurantReservations_error');

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
    const tomorrow = new Date(Date.now());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const id = uuid();

    it('check if constructor works', function () {
        assert.throws(() => new RestaurantReservations(), RestaurantReservationsError);
        assert.throws(() => new RestaurantReservations({ restId: 1, timeTable: {} }), RestaurantReservationsError);
        assert.throws(() => new RestaurantReservations({ restId: '1', timeTable: '{}' }), RestaurantReservationsError);
        assert.throws(() => new RestaurantReservations({ restId: '1', timeTable: '{}' }), RestaurantReservationsError);
        assert.throws(() => new RestaurantReservations({ restId: '1', timeTable: {}, tables: 1 }), RestaurantReservationsError);
        assert.throws(() => new RestaurantReservations({ restId: '1', timeTable: {}, tables: [], threshold: 'asdas' }), RestaurantReservationsError);
        assert.throws(() => new RestaurantReservations({ restId: '1', timeTable: {}, tables: [], threshold: 20, acceptationMode: 'asf' }), RestaurantReservationsError);
        assert.throws(() => new RestaurantReservations({ restId: '1', timeTable: {}, tables: [], threshold: 20, acceptationMode: RestaurantReservations.acceptationModes.MANUAL, reservationLength: 'string' }), RestaurantReservationsError);
        assert.throws(() => new RestaurantReservations({ restId: '1', timeTable: {}, tables: [], threshold: 20, acceptationMode: RestaurantReservations.acceptationModes.MANUAL, reservationLength: 33 }), RestaurantReservationsError);

        const rr = new RestaurantReservations({ restId: '1', timeTable });
        assert.strictEqual(rr.restId, '1');
        assert.deepStrictEqual(rr.timeTable, timeTable);
        assert.deepStrictEqual(rr.tables, []);
        assert.strictEqual(rr.threshold, 20);
        assert.strictEqual(rr.acceptationMode, RestaurantReservations.acceptationModes.MANUAL);
        assert.strictEqual(rr.reservationLength, 60);

        const rr2 = new RestaurantReservations({ restId: '1', timeTable, tables: [], threshold: 30, acceptationMode: RestaurantReservations.acceptationModes.AUTO_THRESHOLD, reservationLength: 90 });

        assert.strictEqual(rr2.restId, '1');
        assert.deepStrictEqual(rr2.timeTable, timeTable);
        assert.deepStrictEqual(rr2.tables, []);
        assert.strictEqual(rr2.threshold, 30);
        assert.strictEqual(rr2.acceptationMode, RestaurantReservations.acceptationModes.AUTO_THRESHOLD);
        assert.strictEqual(rr2.reservationLength, 90);
    });

    it('check if setTimeTable works', function () {
        const rr = new RestaurantReservations({ restId: id, timeTable });
        assert.throws(() => rr.setTimeTable(), RestaurantReservationsError);

        rr.setTimeTable(timeTable);
        assert.deepStrictEqual(rr.timeTable, timeTable);
    });

    it('check if setTables works', function () {
        const rr = new RestaurantReservations({ restId: id, timeTable });
        assert.throws(() => rr.setTables(), RestaurantReservationsError);

        rr.setTables(tables);
        tables.sort((a, b) => (a.people <= b.people ? -1 : 1));
        assert.deepStrictEqual(rr.tables, tables);
    });

    context(`Acceptation mode: ${RestaurantReservations.acceptationModes.MANUAL}`, function () {
        let rr;

        this.beforeEach(() => {
            rr = new RestaurantReservations({ restId: id, timeTable });
        });

        it('check if acceptReservation works', function () {
            assert.throws(() => rr.acceptReservation(), RestaurantReservationsError);
            assert.throws(() => rr.acceptReservation({}), RestaurantReservationsError);

            const res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
            rr.acceptReservation(res);
            assert.deepEqual(rr.reservationMap, { [res.id]: res });
            assert.throws(() => rr.acceptReservation(res), RestaurantReservationsError);

            const res2 = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
            res2.cancelled();
            assert.throws(() => rr.acceptReservation(res2), RestaurantReservationsError);
        });

        it('check if removeReservation works', function () {
            assert.throws(() => rr.removeReservation(), RestaurantReservationsError);
            assert.throws(() => rr.removeReservation({}), RestaurantReservationsError);

            const res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
            assert.throws(() => rr.removeReservation(res.id), RestaurantReservationsError);

            rr.reservationMap = { [res.id]: res };
            rr.removeReservation(res.id)
            assert.deepEqual(rr.reservationMap, {});
            // assert.strictEqual(JSON.stringify(rr.getTables(2)[0].getReservations()), JSON.stringify([]));
        });
    });

    context(`Acceptation mode: ${RestaurantReservations.acceptationModes.AUTO_THRESHOLD}`, function () {
        let rr;

        this.beforeEach(() => {
            rr = new RestaurantReservations({
                restId: id,
                timeTable,
                acceptationMode: RestaurantReservations.acceptationModes.AUTO_THRESHOLD,
                threshold: 15,
                maxReservationSize: 5,
            });
        })

        it('check if acceptReservation & acceptReservationManually works', function () {
            assert.throws(() => rr.acceptReservation(), RestaurantReservationsError);
            assert.throws(() => rr.acceptReservation({}), RestaurantReservationsError);
            

            const res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
            res.cancelled();
            assert.throws(() => rr.acceptReservation(res), RestaurantReservationsError);

            const res2 = new Reservation('pippo', rr.restId, 'pippo', 5, tomorrow.toLocaleDateString(), '15:00');
            rr.acceptReservation(res2);
            assert.deepEqual(rr.reservationMap[res2.id], res2);
            assert.throws(() => rr.acceptReservation(res2), RestaurantReservationsError);

            const res3 = new Reservation('pippo', rr.restId, 'pippo', 6, tomorrow.toLocaleDateString(), '15:00');
            assert.throws(() => rr.acceptReservation(res3), RestaurantReservationsError);
            
            rr.acceptReservationManually(res3);
            assert.deepEqual(rr.reservationMap[res3.id], res3);

            const res4 = new Reservation('pippo', rr.restId, 'pippo', 5, tomorrow.toLocaleDateString(), '15:00');
            assert.throws(() => rr.acceptReservation(res4), RestaurantReservationsError);

            const res5 = new Reservation('pippo', rr.restId, 'pippo', 5, tomorrow.toLocaleDateString(), '15:45');
            assert.throws(() => rr.acceptReservation(res5), RestaurantReservationsError);

            const res6 = new Reservation('pippo', rr.restId, 'pippo', 5, tomorrow.toLocaleDateString(), '16:00');
            rr.acceptReservation(res6);
            assert.deepEqual(rr.reservationMap[res6.id], res6);
        });

        it('check if removeReservation works', function () {
            rr = new RestaurantReservations({
                restId: id,
                timeTable,
                acceptationMode: RestaurantReservations.acceptationModes.AUTO_THRESHOLD,
                threshold: 5,
                maxReservationSize: 5,
            });
            assert.throws(() => rr.removeReservation(), RestaurantReservationsError);
            assert.throws(() => rr.removeReservation({}), RestaurantReservationsError);

            const res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
            assert.throws(() => rr.removeReservation(res.id), RestaurantReservationsError);

            rr.acceptReservation(res);
            rr.removeReservation(res.id);
            assert.deepEqual(rr.reservationMap, {});


            const res2 = new Reservation('pippo', rr.restId, 'pippo', 5, tomorrow.toLocaleDateString(), '15:00');
            const res3 = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
            rr.acceptReservation(res2);
            rr.removeReservation(res2.id);
            assert.doesNotThrow(() => rr.acceptReservation(res3), Error);
        });
    });
});
