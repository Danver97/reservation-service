const List = require('../../lib/list').List;
const TableError = require('../errors/table_error');

class Table {
    constructor(id, restaurantId, people) {
        if (!id || !restaurantId || !people) {
            throw new TableError(`Invalid Table object constructor parameters. Missing the following parameters:
                ${id ? '' : ' id'}
                ${restaurantId ? '' : ' restaurantId'}
                ${people ? '' : ' people'}`, TableError.paramError);
        }
        this.id = id;
        this.restId = restaurantId;
        this.people = people;
        this.reservations = new List();
        this.reservationsMap = {};
        this.reservationsArr = null;
    }

    static fromObject(obj) {
        return new Table(obj.id, obj.restId, obj.people);
    }

    addReservation(reservation) { // O(1)
        if (!reservation)
            throw new TableError(`Missing the following parameters: reservation`, TableError.paramError);
        this.reservationsMap[reservation.id] = this.reservations.push(reservation);
        this.reservationsArr = null;
    }

    removeReservation(resId) { // O(1)
        if (!resId)
            throw new TableError(`Missing the following parameters: resId`, TableError.paramError);
        this.reservations.remove(this.reservationsMap[resId]);
        delete this.reservationsMap[resId];
        this.reservationsArr = null;
    }

    getReservations() { // O(N) - N: total reservations
        if (this.reservationsArr)
            return this.reservationsArr;
        const arr = this.reservations.toArray();
        arr.sort((a, b) => (a.date.getTime() < b.date.getTime() ? -1 : 1));
        this.reservationsArr = arr;
        return arr;
    }

    toString(space) {
        return JSON.stringify(this, (k, v) => {
            if (k === 'reservations')
                return this.getReservations();
            if (k === 'reservationsArr')
                return undefined;
            if (k === 'reservationsMap')
                return undefined;
            return v;
        }, space);
    }
}

module.exports = Table;
