const uuid = require('uuid/v4');
const ReservationError = require('../errors/reservation_error');

const statusCodes = {
    pending: 0,
    confirmed: 1,
    rejected: 2,
    cancelled: 3,
};

function parseHour(hour) {
    const h = hour.split(':');
    if (!h[1])
        throw new ReservationError('Invalid Reservation object hour parameter.');
    const h1 = parseInt(h[0], 10);
    const m1 = parseInt(h[1], 10);
    if (Number.isNaN(h1) || Number.isNaN(m1))
        throw new ReservationError('Invalid Reservation object hour parameter.');
    return { h: h1, m: m1 };
}

class Reservation {
    constructor(userId, restaurantId, reservationName, people, date, hour) {
        if (!userId || !reservationName || !people || !restaurantId || !date || !hour) {
            throw new ReservationError(`Invalid Reservation object constructor parameters. Missing the following parameters:
                ${userId ? '' : ' userId'}
                ${reservationName ? '' : ' reservationName'}
                ${people ? '' : ' people'}
                ${restaurantId ? '' : ' restaurantId'}
                ${date ? '' : ' date'}
                ${hour ? '' : ' hour'}`, ReservationError.paramError);
        }
        this.status = undefined;
        this.id = uuid();
        this.userId = userId;
        this.reservationName = reservationName;
        this.people = people;
        this.restId = restaurantId;
        this.table = undefined;
        this.date = new Date(date);
        const h = parseHour(hour);
        this.date.setHours(parseInt(h.h, 10));
        this.date.setMinutes(parseInt(h.m, 10));
        this.statusCode = -1;
        this.status = 'created';
        this.pending();
    }

    static fromObject(obj) {
        const res = new Reservation(obj.userId, obj.restId, obj.reservationName, obj.people, obj.date, '15:00');
        res.id = obj.id;
        res.setStatus(obj.status);
        res.date = new Date(obj.date);
        if (res.statusCode === 1)
            res.setTable(obj.table);

        Object.keys(obj).forEach(k => {
            if (/^_.*/.test(k))
                res[k] = obj[k];
        });
        // res.created = new Date(obj.created);
        return res;
    }

    pending() {
        if (this.statusCode < 0)
            this.setStatus('pending');
        else {
            throw new ReservationError(
                `This reservation is already ${this.status} and can't be set into a pending state.`,
                ReservationError.statusChangeError,
            );
        }
    }

    accepted(table, effectiveDate) {
        this.setTable(table);
        this.confirmed();
        if (effectiveDate)
            this.date = effectiveDate;
    }

    confirmed() {
        if (this.statusCode === 0)
            this.setStatus('confirmed');
        else {
            throw new ReservationError(
                `This reservation is already ${this.status} and can't be set into a confirmed state.`,
                ReservationError.statusChangeError,
            );
        }
    }

    rejected() {
        if (this.statusCode === 0)
            this.setStatus('rejected');
        else {
            throw new ReservationError(
                `This reservation is already ${this.status} and can't be set into a rejected state.`,
                ReservationError.statusChangeError,
            );
        }
        // this.setTable(null, null);
    }

    cancelled() {
        if (this.statusCode <= 2)
            this.setStatus('cancelled');
        else {
            throw new ReservationError(
                `This reservation is already ${this.status} and can't be set into a cancelled state.`,
                ReservationError.statusChangeError,
            );
        }
        // this.setTable(null, null);
    }

    setStatus(status) {
        this.status = status;
        this.statusCode = statusCodes[status];
    }

    setTable(table) {
        if (!table)
            throw new ReservationError('Table required.', ReservationError.paramError);
        if (!table.id || !table.people)
            throw new ReservationError(`Invalid table object. Missing${table.id ? '' : ' id'}${table.people ? '' : ' people'}`);
        if (this.people > table.people) {
            throw new ReservationError(`Invalid Reservation table: the assigned table (${table.people} people)
            is too little for ${this.people} people.`, ReservationError.tooSmallTableError);
        }
        this.table = { id: table.id, people: table.people };
    }
}

module.exports = Reservation;
