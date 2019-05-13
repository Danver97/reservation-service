const RestaurantReservationError = require('../errors/restaurantReservations_error');
const Reservation = require('./reservation');
const Table = require('./table');

class RestaurantReservations {
    constructor(restId, timeTable, tables) {
        if (!restId || !timeTable || !tables) {
            throw new RestaurantReservationError(`Invalid Reservation object constructor parameters. Missing the following parameters:
                ${restId ? '' : ' restId'}
                ${timeTable ? '' : ' timeTable'}
                ${tables ? '' : ' tables'}`, RestaurantReservationError.paramError);
        }
        this.restId = restId;
        this.setTimeTable(timeTable);
        this.reservationsTableId = {};
        this.setTables(tables);
    }

    setTimeTable(timeTable) {
        if (!timeTable) {
            throw new RestaurantReservationError(`Missing the following parameters: timeTable`, RestaurantReservationError.paramError);
        }
        this.timeTable = timeTable;
    }

    setTables(tables) {
        if (!tables) {
            throw new RestaurantReservationError(`Missing the following parameters: tables`, RestaurantReservationError.paramError);
        }
        this.tables = tables.map(t => Table.fromObject(t));
        this.tables.sort((a, b) => (a.people <= b.people ? -1 : 1));
        this.tablesMap = {};
        this.tables.forEach(t => { this.tablesMap[t.id] = t; });
    }

    reservationAdded(reservation) { // O(1)
        if (!reservation) {
            throw new RestaurantReservationError(`Missing the following parameters: reservation
            `, RestaurantReservationError.paramError);
        }
        if (!(reservation instanceof Reservation))
            throw new RestaurantReservationError("'reservation' must be instance of Reservation class", RestaurantReservationError.paramError);
        if (this.reservationsTableId[reservation.id]) {
            throw new RestaurantReservationError(
                `Reservation with id ${reservation.id} already added`, RestaurantReservationError.reservationAlreadyAddedError,
            );
        }
        if (reservation.status !== 'confirmed')
            throw new RestaurantReservationError(`Reservation must be in a 'confirmed' status. Status found: ${reservation.status}`);
        const t = this.tablesMap[reservation.table.id];
        t.addReservation(reservation);
        this.reservationsTableId[reservation.id] = t.id;
    }

    reservationRemoved(resId) { // O(1)
        if (!resId && resId !== 0)
            throw new RestaurantReservationError(`Missing the following parameters: resId`, RestaurantReservationError.paramError);
        const type = typeof resId;
        if (type !== 'number' && type !== 'string')
            throw new RestaurantReservationError(`'resId' must be string or number. Found: ${type}`, RestaurantReservationError.paramError);
        if (!this.reservationsTableId[resId])
            throw new RestaurantReservationError(`Reservation with id ${resId} not found`, RestaurantReservationError.reservationNotFoundError);
        const t = this.tablesMap[this.reservationsTableId[resId]];
        t.removeReservation(resId);
        delete this.reservationsTableId[resId];
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
