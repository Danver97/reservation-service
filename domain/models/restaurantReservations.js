const RestaurantReservationError = require('../errors/restaurantReservations_error');
const Reservation = require('./reservation');
const Table = require('./table');

class RestaurantReservations {
    constructor(restId, timeTable, tables) {
        if (!restId || !timeTable || !tables) {
            throw new RestaurantReservationError(`Invalid Reservation object constructor parameters.
                Missing:${restId ? '' : ' restId'}${timeTable ? '' : ' timeTable'}${tables ? '' : ' tables'}`);
        }
        this.restId = restId;
        this.setTimeTable(timeTable);
        this.reservationsTableId = {};
        this.setTables(tables);
    }

    setTimeTable(timeTable) {
        if (!timeTable)
            throw new RestaurantReservationError(`Time table can't be undefined or null. Found: ${timeTable}`);
        this.timeTable = timeTable;
    }

    setTables(tables) {
        if (!tables)
            throw new RestaurantReservationError(`Time table can't be undefined or null. Found: ${tables}`);
        this.tables = tables.map(t => Table.fromObject(t));
        this.tables.sort((a, b) => (a.people <= b.people ? -1 : 1));
        this.tablesMap = {};
        this.tables.forEach(t => { this.tablesMap[t.id] = t; });
    }

    reservationAdded(reservation) { // O(1)
        if (!reservation)
            throw new RestaurantReservationError(`'reservation' can't be undefined or null. Found: ${reservation}`);
        if (!(reservation instanceof Reservation))
            throw new RestaurantReservationError("'reservation' must be instance of Reservation class.");
        if (this.reservationsTableId[reservation.id])
            throw new RestaurantReservationError('reservation already added');
        if (reservation.status !== 'confirmed')
            throw new RestaurantReservationError(`reservation must be in a 'confirmed' status. Status found: ${reservation.status}`);
        const t = this.tablesMap[reservation.table.id];
        t.addReservation(reservation);
        this.reservationsTableId[reservation.id] = t.id;
    }

    reservationRemoved(resId) { // O(1)
        if (!resId && resId !== 0)
            throw new RestaurantReservationError(`'resId' can't be undefined or null. Found: ${resId}`);
        const type = typeof resId;
        if (type !== 'number' && type !== 'string')
            throw new RestaurantReservationError(`'resId' must be string or number. Found: ${type}`);
        if (!this.reservationsTableId[resId])
            throw new RestaurantReservationError('reservation not found');
        const t = this.tablesMap[this.reservationsTableId[resId]];
        t.removeReservation(resId);
        delete this.reservationsTableId[resId];
    }

    getTables(people) { // O(N) - N: total tables
        let index = 0;
        for (index = 0; index < this.tables.length; index++) {
            if (this.tables[index].people >= people)
                break;
        }
        return this.tables.slice(index, this.tables.length);
    }
}

module.exports = RestaurantReservations;
