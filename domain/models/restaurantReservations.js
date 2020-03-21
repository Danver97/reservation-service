const RestaurantReservationError = require('../errors/restaurantReservations_error');
const Reservation = require('./reservation');
const Table = require('./table');

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

    reservationAdded(reservation) { // O(1)
        if (!reservation)
            throw RestaurantReservationError.paramError(`Missing the following parameters: reservation`);
        if (!(reservation instanceof Reservation))
            throw RestaurantReservationError.paramError("'reservation' must be instance of Reservation class");
        if (this.reservationsTableId[reservation.id])
            throw RestaurantReservationError.reservationAlreadyAddedError(`Reservation with id ${reservation.id} already added`);
        if (reservation.status !== 'confirmed')
            throw RestaurantReservationError.reservationStatusError(`Reservation must be in a 'confirmed' status. Status found: ${reservation.status}`);
        const t = this.tablesMap[reservation.table.id];
        t.addReservation(reservation);
        this.reservationsTableId[reservation.id] = t.id;
    }

    reservationRemoved(resId) { // O(1)
        if (!resId && resId !== 0)
            throw RestaurantReservationError.paramError(`Missing the following parameters: resId`);
        const type = typeof resId;
        if (type !== 'number' && type !== 'string')
            throw RestaurantReservationError.paramError(`'resId' must be string or number. Found: ${type}`);
        if (!this.reservationsTableId[resId])
            throw RestaurantReservationError.reservationNotFoundError(`Reservation with id ${resId} not found`);
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
