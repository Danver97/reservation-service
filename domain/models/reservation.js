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
    
    static fromObject(obj) {
        const res = new Reservation(obj.userId, obj.restaurantId, obj.reservationName, obj.people, obj.date, '15:00');
        res.id = obj.id;
        res.status = obj.status;
        res.date = new Date(obj.date);
        res.tableId = obj.tableId;
        res.tablePeople = obj.tablePeople;
        // res.created = new Date(obj.created);
        return res;
    }
    
    pending() {
        if (this.status === 'pending')
            throw new ReservationError('This reservation is already in pending state.');
        this.status = 'pending';
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
    
    cancelled() {
        this.status = 'cancelled';
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
