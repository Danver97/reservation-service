const RestaurantReservationError = require('../errors/restaurantReservations_error');
const Reservation = require('./reservation');
const Table = require('./table');

const slotLength = 15;
const resLength = slotLength * 4;

function min(m) {
    return m * 60 * 1000;
}

class RestaurantReservations {
    /**
     * @constructor
     * @param {object} options 
     * @param {string} options.restId 
     * @param {object} options.timeTable 
     * @param {Table[]} options.tables 
     * @param {number} options.threshold 
     */
    constructor(options = {}) {
        const { restId, timeTable, tables, threshold } = options;
        this._checkConstrParams(restId, timeTable, tables, threshold);
        this.restId = restId;
        this.setTimeTable(timeTable);
        if (tables) this.setTables(tables);
        this.reservationMap = {};
        this.threshold = threshold;
        this.timeSlotsPeople = {};
    }

    _checkConstrParams(restId, timeTable, tables, threshold) {
        if (!restId || !timeTable || !threshold) {
            throw RestaurantReservationError.paramError(`Invalid Reservation object constructor parameters. Missing the following parameters:
                ${restId ? '' : ' restId'}
                ${timeTable ? '' : ' timeTable'}
                ${threshold ? '' : ' threshold'}`);
        }
        if (typeof restId !== 'string')
            throw RestaurantReservationError.paramError(`'restId' must be a string`);
        if (typeof timeTable !== 'object')
            throw RestaurantReservationError.paramError(`'timeTable' must be an instance of TimeTable`);
        if (tables && !Array.isArray(tables))
            throw RestaurantReservationError.paramError(`'tables' must be an array of Tables`);
        if (typeof threshold !== 'number')
            throw RestaurantReservationError.paramError(`'threshold' must be a number`);
    }

    setTimeTable(timeTable) {
        if (!timeTable)
            throw RestaurantReservationError.paramError(`Missing the following parameters: timeTable`);
        this.timeTable = timeTable;
    }

    setTables(tables) {
        if (!tables)
            throw RestaurantReservationError.paramError(`Missing the following parameters: tables`);
        this.tables = tables.map(t => Table.fromObject(t));
        this.tables.sort((a, b) => (a.people <= b.people ? -1 : 1));
        this.tablesMap = {};
        this.tables.forEach(t => { this.tablesMap[t.id] = t; });
    }

    _addByNumber(reservation) {
        if (this.reservationMap[reservation.id])
            throw RestaurantReservationError.reservationAlreadyAddedError(`Reservation with id ${reservation.id} already added`);
        const endOfRes = reservation.date.getTime() + min(resLength);
        let cursor = reservation.date.getTime();
        // Checks if the threshold is not broken in the timeslots covered by the reservation
        while (cursor < endOfRes) {
            if (this.timeSlotsPeople[cursor] + reservation.people > this.threshold)
                throw new RestaurantReservationError();
            cursor += min(slotLength);
        }

        cursor = reservation.date.getTime();
        // Adds the peoples in the timeslots covered by the reservation
        while (cursor < endOfRes) {
            this.timeSlotsPeople[cursor] += reservation.people;
            cursor += min(slotLength);
        }
        this.reservationMap[reservation.id] = reservation;
    }

    _removeByNumber(resId) {
        if (!this.reservationMap[resId])
            throw RestaurantReservationError.reservationNotFoundError(`Reservation with id ${resId} not found`);
        const reservation = this.reservationMap[resId];
        const endOfRes = reservation.date.getTime() + min(resLength);
        let cursor = reservation.date.getTime();
        // Removes the peoples in the timeslots covered by the reservation
        while (cursor < endOfRes) {
            this.timeSlotsPeople[cursor] -= reservation.people;
            cursor += min(slotLength);
        }
        delete this.reservationMap[reservation.id];
    }

    reservationAdded(reservation) { // O(1)
        if (!reservation)
            throw RestaurantReservationError.paramError(`Missing the following parameters: reservation`);
        if (!(reservation instanceof Reservation))
            throw RestaurantReservationError.paramError("'reservation' must be instance of Reservation class");
        if (reservation.status !== 'confirmed')
            throw RestaurantReservationError.reservationStatusError(`Reservation must be in a 'confirmed' status. Status found: ${reservation.status}`);
        // this._addByTables(reservation);
        this._addByNumber(reservation);
    }

    reservationRemoved(resId) { // O(1)
        if (!resId && resId !== 0)
            throw RestaurantReservationError.paramError(`Missing the following parameters: resId`);
        const type = typeof resId;
        if (type !== 'number' && type !== 'string')
            throw RestaurantReservationError.paramError(`'resId' must be string or number. Found: ${type}`);
        // this._removeByTables(resId);
        this._removeByNumber(resId);
    }

    getTables(people = 0) { // O(N) - N: total tables
        let index = 0;
        for (index = 0; index < this.tables.length; index++) {
            if (this.tables[index].people >= people)
                break;
        }
        return this.tables.slice(index, this.tables.length);
    }
}

module.exports = RestaurantReservations;
