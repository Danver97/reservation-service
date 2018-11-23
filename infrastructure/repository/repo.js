const ReservationEvents = require('../../lib/reservation-events');
const Table = require('../../domain/models/table');
const Utils = require('../../lib/utils');

const Promisify = Utils.promisify;

const restaturants = {
    1: {
        restId: 1,
        tables: [
            new Table(1, 1, 2),
            new Table(2, 1, 3),
            new Table(3, 1, 4),
            new Table(4, 1, 4),
            new Table(5, 1, 4),
            new Table(6, 1, 6),
        ],
    },
    2: {
        restId: 2,
        tables: [
            new Table(1, 2, 2),
            new Table(3, 2, 4),
            new Table(2, 2, 3),
            new Table(4, 2, 4),
            new Table(5, 2, 6),
        ],
    },
};

function reservationPending(restId, payload, cb) {
    return this.save(restId, ReservationEvents.topic, ReservationEvents.reservationPending, Object.assign({}, payload), cb);
}

function reservationAccepted(restId, payload, cb) {
    return this.save(restId, ReservationEvents.topic, ReservationEvents.reservationAccepted, Object.assign({}, payload), cb);
}

function reservationFailed(restId, payload, cb) {
    return this.save(restId, ReservationEvents.topic, ReservationEvents.reservationFailed, Object.assign({}, payload), cb);
}

function getPreviousPendingResCount(restId, created, date, cb) {
    return Promisify(async () => {
        const stream = await this.getStream(restId);
        const pending = stream.map(r => r.payload)
            .filter(a => a.status === 'pending' && a.created.getTime() < created.getTime() 
                    && a.date.getTime() + Utils.hours(1) + Utils.mins(15) >= date.getTime());

        const accepted = stream.map(r => r.payload)
            .filter(a => a.status === 'accepted' && a.created.getTime() < created.getTime());
        
        const result = pending.filter(a => !(accepted.filter(b => b.id === a.id).length >= 1));
        
        return result.length; // */
    }, cb);
}

function getPreviousPendingRes(restId, created, date, cb) {
    return Promisify(async () => {
        const stream = await this.getStream(restId);
        let pending = stream.map(r => r.payload)
            .filter(a => a.status === 'pending' 
                    && a.created.getTime() < created.getTime() 
                    && ((a.date.getTime() + Utils.hours(1) + Utils.mins(15) > date.getTime() 
                         && a.date.getTime() <= date.getTime()) 
                        || (a.date.getTime() - Utils.mins(15) < date.getTime() + Utils.hours(1) 
                            && a.date.getTime() >= date.getTime())));

        const accepted = stream.map(r => r.payload)
            .filter(a => a.status === 'accepted' && a.created.getTime() < created.getTime());

        const failed = stream.map(r => r.payload)
            .filter(a => a.status === 'failed' && a.created.getTime() < created.getTime());

        pending = pending.filter(a => !(accepted.filter(b => b.id === a.id).length >= 1) 
                                 && !(failed.filter(b => b.id === a.id).length >= 1));
        const result = {};
        let max = 0;
        pending.forEach(p => {
            if (p.people > max);
            max = p.people;
            if (!result[p.people])
                result[p.people] = 0;
            result[p.people] += 1;
        });
        result[0] = 0;
        for (let i = 1; i <= max; i++) {
            if (!result[i])
                result[i] = result[i - 1];
            else
                result[i] += result[i - 1];
        }
        return result;
    }, cb);
}

function getReservationsFromDateToDate(restId, fromDate, toDate, cb) {
    return Promisify(async () => {
        const stream = await this.getStream(restId);
        return stream.map(r => r.payload)
            .filter(a => a.status === 'accepted' && a.date.getTime() >= fromDate.getTime() && a.date.getTime() <= toDate.getTime());
    }, cb);
}

function getTables(restId, cb) {
    return Promisify(() => {
        let result;
        const rest = restaturants[restId] || {};
        if (rest)
            result = rest.tables || [];
        else
            throw new Error(`no restaurant with id ${restId}`);
        return result;
    }, cb);
}

function getReservations(restId, cb) {
    return Promisify(async () => {
        const now = new Date(Date.now());
        now.setMinutes(now.getMinutes() - 30);
        const stream = await this.getStream(restId);
        let result = stream.map(r => r.payload).filter(a => a.status === 'accepted' && a.date.getTime() >= now.getTime());
        if (result.length === 0)
            result = null;
        if (!result)
            throw new Error(`No such reservation with restId = ${restId}`);
        return result;
    }, cb);
}

function getReservation(restId, resId, cb) {
    return Promisify(async () => {
        const stream = await this.getStream(restId);
        let result = stream.map(r => r.payload).filter(a => a.id == resId);
        if (result.length === 1)
            result = result[0];
        else
            result = null;
        if (!result)
            throw new Error(`No such reservation with restId = ${restId} and resId = ${resId}`);
        return result;
    }, cb);
}

function exportFunc(db) {
    return Object.assign(db, {
        reservationPending: reservationPending.bind(db),
        reservationAccepted: reservationAccepted.bind(db),
        reservationFailed: reservationFailed.bind(db),
        getPreviousPendingResCount: getPreviousPendingResCount.bind(db),
        getPreviousPendingRes: getPreviousPendingRes.bind(db),
        getReservationsFromDateToDate: getReservationsFromDateToDate.bind(db),
        getTables: getTables.bind(db),
        getReservations: getReservations.bind(db),
        getReservation: getReservation.bind(db),
    });
}

module.exports = exportFunc;
