const assert = require('assert');
const uuid = require('uuid/v4');
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
    let res;
    const tomorrow = new Date(Date.now());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const id = uuid();
    const rr = new RestaurantReservations(id, timeTable);
    
    it('check if constructor works', function () {
        assert.strictEqual(rr.restId, id);
        assert.strictEqual(JSON.stringify(rr.timeTable), JSON.stringify(timeTable));
    });
    
    it('check if setTimeTable works', function () {
        
    });
    
    it('check if reservationAccepted works', function () {
        assert.throws(() => rr.reservationAccepted({}), RestaurantReservationsError);
        res = new Reservation('pippo', rr.restId, 'pippo', 1, tomorrow.toLocaleDateString(), '15:00');
        rr.reservationAccepted(res);
        assert.throws(() => rr.reservationAccepted(res), RestaurantReservationsError);
        assert.strictEqual(JSON.stringify(rr.sortReservations()), JSON.stringify([res]));
    });
    
    it('check if reservationCancelled works', function () {
        assert.throws(() => rr.reservationCancelled({}), RestaurantReservationsError);
        rr.reservationCancelled(res.id);
        assert.throws(() => rr.reservationCancelled(res.id), RestaurantReservationsError);
        assert.strictEqual(JSON.stringify(rr.sortReservations()), JSON.stringify([]));
    });
    
    it('check if reservationFailed works', function () {
        assert.throws(() => rr.reservationFailed({}), RestaurantReservationsError);
        res = new Reservation('pippo2', rr.restId, 'pippo2', 1, tomorrow.toLocaleDateString(), '15:00');
        rr.reservationFailed(res);
        assert.strictEqual(JSON.stringify(rr.sortReservations()), JSON.stringify([]));
        
        rr.reservationAccepted(res);
        assert.throws(() => rr.reservationFailed(res), RestaurantReservationsError);
        assert.strictEqual(JSON.stringify(rr.sortReservations()), JSON.stringify([res]));
        rr.reservationCancelled(res.id);
    });
    
    it('check if sortReservations works', function () {
        const res1 = new Reservation('pippo3', rr.restId, 'pippo3', 1, tomorrow.toLocaleDateString(), '16:00');
        const res2 = new Reservation('pippo4', rr.restId, 'pippo4', 1, tomorrow.toLocaleDateString(), '15:00');
        
        rr.reservationAccepted(res1);
        let reservationsSorted = rr.sortReservations();
        assert.strictEqual(JSON.stringify(reservationsSorted.map(r => r.id)), JSON.stringify([res1.id]));
        
        rr.reservationAccepted(res2);
        reservationsSorted = rr.sortReservations();
        assert.strictEqual(JSON.stringify(reservationsSorted.map(r => r.id)), JSON.stringify([res2.id, res1.id]));
    });
});
