const List = require('../../lib/list').List;

class Table {
    constructor(id, restaurantId, people) {
        if (!id || !restaurantId || !people)
            throw new Error('Invalid Table object constructor parameters.');
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
        this.reservationsMap[reservation.id] = this.reservations.push(reservation);
        this.reservationsArr = null;
    }

    removeReservation(resId) { // O(1)
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
}

module.exports = Table;
