const RestaurantReservationError = require('../errors/restaurantReservations_error');
const Reservation = require('./reservation');

class RestaurantReservations {
    constructor(restId, timeTable) {
        this.restId = restId;
        this.timeTable = timeTable;
        this.reservations = new Map();
        this.reservationsSorted = null;
        this.resSortedInvalidated = true;
    }
    
    setTimeTable(timeTable) {
        if (!timeTable)
            throw new RestaurantReservationError(`Time table can't be undefined or null found: ${timeTable}`);
        this.timeTable = timeTable;
    }
    
    reservationAccepted(res) {
        if (!(res instanceof Reservation))
            throw new RestaurantReservationError('res argument is not instance of Reservation');
        if (!this.reservations.has(res.id)) {
            this.reservations.set(res.id, res);
            this.resSortedInvalidated = true;
        } else
            throw new RestaurantReservationError('Reservation already present.');
    }
    
    reservationCancelled(resId) {
        if (this.reservations.delete(resId))
            this.resSortedInvalidated = true;
        else
            throw new RestaurantReservationError('Reservation not present.');
    }
    
    reservationFailed(res) {
        if (!(res instanceof Reservation))
            throw new RestaurantReservationError('res argument is not instance of Reservation');
        if (this.reservations.has(res.id))
            throw new RestaurantReservationError('Reservation already accepted.');
    }
    
    sortReservations() {
        if (this.reservationsSorted && !this.resSortedInvalidated) {
            this.resSortedInvalidated = false;
            return this.reservationsSorted;
        }
        this.reservationsSorted = Array.from(this.reservations.values()).sort((a, b) => (a.date.getTime() < b.date.getTime() ? -1 : 1));
        return this.reservationsSorted;
    }
}

module.exports = RestaurantReservations;
