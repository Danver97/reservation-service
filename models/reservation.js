const ReservationError = require('../errors/reservation_error');

let resCode = 0;
    
function parseHour(hour) {
    const h = hour.split(':');
    if (!h[1])
        throw new ReservationError('Invalid Reservation object hour parameter.');
    const h1 = parseInt(h[0], 10);
    const m1 = parseInt(h[1], 10);
    if (isNaN(h1) || isNaN(m1))
        throw new ReservationError('Invalid Reservation object hour parameter.');
    return { h: h1, m: m1 };
}

class Reservation {
    constructor(userId, restaurantId, reservationName, people, date, hour) {
        if (!userId || !reservationName || !people || !restaurantId || !date || !hour)
            throw new ReservationError('Invalid Reservation object constructor parameters.');
        this.status = undefined;
        this.id = resCode++;
        this.userId = userId;
        this.reservationName = reservationName;
        this.people = people;
        this.restaurantId = restaurantId;
        this.tableId = undefined;
        this.tablePeople = undefined;
        this.date = new Date(date);
        const h = parseHour(hour);
        this.date.setHours(parseInt(h.h, 10));
        this.date.setMinutes(parseInt(h.m, 10));
    }
    
    pending() {
        if (this.status === 'pending')
            throw new ReservationError('This reservation is already in pending state.');
        this.status = 'pending';
        this.created = new Date();
    }
    
    accepted(table, effectiveDate) {
        if (this.status === 'accepted')
            throw new ReservationError('This reservation is already in accepted state.');
        this.status = 'accepted';
        if (effectiveDate)
            this.date = effectiveDate;
        this.setTable(table.id, table.people);
    }
    
    failed() {
        this.status = 'failed';
        // this.setTable(null, null);
    }
    
    setTable(tableId, people) {
        this.tableId = tableId;
        if (this.people > people)
            throw new ReservationError('Invalid Reservation table: the assigned table (' + people + ' people) is too little for ' + this.people + ' people.');
        this.tablePeople = people;
    }
}

module.exports = Reservation;
