const RestaurantReservationError = require('../errors/restaurantReservations_error');
const Reservation = require('./reservation');
const Table = require('./table');

const slotLength = 15;
const resLength = slotLength * 4;

function min(m) {
    return m * 60 * 1000;
}

class RestaurantReservations {
    constructor(restId, timeTable, tables) {
        if (!restId || !timeTable || !tables) {
            throw RestaurantReservationError.paramError(`Invalid Reservation object constructor parameters. Missing the following parameters:
                ${restId ? '' : ' restId'}
                ${timeTable ? '' : ' timeTable'}
                ${tables ? '' : ' tables'}`);
        }
        this.restId = restId;
        this.setTimeTable(timeTable);
        this.reservationsTableId = {};
        this.setTables(tables);
        this.reservationMap = {};
        this.threshold = 20;
        this.byNumberConfig = {
            buckets: {},
        }
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
            if (this.byNumberConfig.buckets[cursor] + reservation.people > this.threshold)
                throw new RestaurantReservationError();
            cursor += min(slotLength);
        }

        cursor = reservation.date.getTime();
        // Adds the peoples in the timeslots covered by the reservation
        while (cursor < endOfRes) {
            this.byNumberConfig.buckets[cursor] += reservation.people;
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
            this.byNumberConfig.buckets[cursor] -= reservation.people;
            cursor += min(slotLength);;
        }
        delete this.reservationMap[reservation.id];
    }

    _addByTables(reservation) {
        if (this.reservationsTableId[reservation.id])
            throw RestaurantReservationError.reservationAlreadyAddedError(`Reservation with id ${reservation.id} already added`);
        const t = this.tablesMap[reservation.table.id];
        t.addReservation(reservation);
        this.reservationsTableId[reservation.id] = t.id;
    }

    _removeByTables(resId) {
        if (!this.reservationsTableId[resId])
            throw RestaurantReservationError.reservationNotFoundError(`Reservation with id ${resId} not found`);
        const t = this.tablesMap[this.reservationsTableId[resId]];
        t.removeReservation(resId);
        delete this.reservationsTableId[resId];
    }

    reservationAdded(reservation) { // O(1)
        if (!reservation)
            throw RestaurantReservationError.paramError(`Missing the following parameters: reservation`);
        if (!(reservation instanceof Reservation))
            throw RestaurantReservationError.paramError("'reservation' must be instance of Reservation class");
        if (reservation.status !== 'confirmed')
            throw RestaurantReservationError.reservationStatusError(`Reservation must be in a 'confirmed' status. Status found: ${reservation.status}`);
        this._addByTables(reservation);
        // this._addByNumber(reservation);
    }

    reservationRemoved(resId) { // O(1)
        if (!resId && resId !== 0)
            throw RestaurantReservationError.paramError(`Missing the following parameters: resId`);
        const type = typeof resId;
        if (type !== 'number' && type !== 'string')
            throw RestaurantReservationError.paramError(`'resId' must be string or number. Found: ${type}`);
        this._removeByTables(resId);
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

const buckets = {};
const resMap = {};

function min(m) {
    return m * 60 * 1000;
}

function addRes(res) {
    const endOfRes = res.date.getTime() + min(resLength);
    const cursor = res.date.getTime();
    while (cursor < endOfRes) {
        buckets[cursor] += res.people;
        cursor += slotLength;
    }
    resMap[res.id] = res;
}