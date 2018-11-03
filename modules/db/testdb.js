const EventEmitter = require('events');
const Table = require('../../models/table');
const Reservation = require('../../models/reservation');
const Utils = require('../../lib/utils');
const ReservationEvents = require('../reservation-events');

const Promisify = Utils.promisify;

const restaturants = [
    {
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
    {
        restId: 2,
        tables: [
            new Table(1, 2, 2),
            new Table(3, 2, 4),
            new Table(2, 2, 3),
            new Table(4, 2, 4),
            new Table(5, 2, 6),
        ],
    },
];
let eventCode = 0;
const emitter = new EventEmitter();
// let reservations = [];
let eventStore = {};
let snapshots = {};

function save(streamId, topic, message, payload, cb) {
    return Promisify(() => {
        if (!eventStore[streamId])
            eventStore[streamId] = { streamId, revision: 0, events: [] };
        const revision = eventStore[streamId].revision;
        const event = {
            eventId: eventCode,
            topic,
            message,
            payload: Object.assign({}, payload),
        };
        if (revision !== eventStore[streamId].revision)
            throw new Error('Wrong revision!');
        else
            eventStore[streamId].events.push(event);
        eventCode++;
        return eventCode;
    }, cb);
}

function persist(event, cb) {
    event.payload = Reservation.fromObject(event.payload);
    return save(event.streamId, event.topic, event.message, event.payload, cb);
}
    
function emit(message, payload) {
    emitter.emit(message, payload);
}
    
function on(message, cb) {
    emitter.on(message, cb);
}

function publishEvent(event) {
    const promise = persist(event);
    emit(`${event.topic}:${event.message}`, event);
    return promise;
}

function getStream(streamId, cb) {
    const result = new Promise(resolve => {
        if (cb)
            cb(eventStore[streamId]);
        resolve(eventStore[streamId]);
    });
    if (cb)
        return null;
    return result;
}

function getSnapshot(aggregateId, cb) {
    const result = new Promise(resolve => {
        if (cb)
            cb(snapshots[aggregateId]);
        resolve(snapshots[aggregateId]);
    });
    if (cb)
        return null;
    return result;
}

function reservationPending(restId, payload, cb) {
    return save(restId, ReservationEvents.topic, ReservationEvents.reservationPending, payload, cb);
}

function reservationAccepted(restId, payload, cb) {
    return save(restId, ReservationEvents.topic, ReservationEvents.reservationAccepted, payload, cb);
}

function reservationFailed(restId, payload, cb) {
    return save(restId, ReservationEvents.topic, ReservationEvents.reservationFailed, payload, cb);
}

function getPreviousPendingResCount(restId, created, date, cb) {
    // return result.length;
    return Promisify(() => {
        const pending = eventStore[restId].events.map(r => r.payload)
            .filter(a => a.status === 'pending' && a.created.getTime() < created.getTime() 
                    && a.date.getTime() + Utils.hours(1) + Utils.mins(15) >= date.getTime());

        const accepted = eventStore[restId].events.map(r => r.payload)
            .filter(a => a.status === 'accepted' && a.created.getTime() < created.getTime());
        
        const result = pending.filter(a => !(accepted.filter(b => b.id === a.id).length >= 1));
        
        return result.length;
    }, cb);
}

function getPreviousPendingRes(restId, created, date, cb) {
    // return result;
    return Promisify(() => {
        let pending = eventStore[restId].events.map(r => r.payload)
            .filter(a => a.status === 'pending' 
                    && a.created.getTime() < created.getTime() 
                    && ((a.date.getTime() + Utils.hours(1) + Utils.mins(15) > date.getTime() 
                         && a.date.getTime() <= date.getTime()) 
                        || (a.date.getTime() - Utils.mins(15) < date.getTime() + Utils.hours(1) 
                            && a.date.getTime() >= date.getTime())));

        const accepted = eventStore[restId].events.map(r => r.payload)
            .filter(a => a.status === 'accepted' && a.created.getTime() < created.getTime());

        const failed = eventStore[restId].events.map(r => r.payload)
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
    // return result;
    return Promisify(() => eventStore[restId].events.map(r => r.payload)
        .filter(a => a.status === 'accepted' && a.date.getTime() >= fromDate.getTime() && a.date.getTime() <= toDate.getTime()),
    cb);
}

function getTables(restId, cb) {
    /* let rests = restaturants.filter((r) => {
        return r.restId == restId
    });
    if (rests.length >= 1) {
        return rests[0].tables;
    } else
        throw new Error('no restaurant with id ' + restId); */
    return Promisify(() => {
        let result;
        const rests = restaturants.filter(r => r.restId === restId);
        if (rests.length >= 1)
            result = rests[0].tables;
        else
            throw new Error(`no restaurant with id ${restId}`);
        return result;
    }, cb);
}

function getReservations(restId, cb) {
    return Promisify(() => {
        const now = new Date(Date.now());
        now.setMinutes(now.getMinutes() - 30);
        let result = eventStore[restId].events.map(r => r.payload).filter(a => a.status === 'accepted' && a.date.getTime() >= now.getTime());
        if (result.length === 0)
            result = null;
        if (!result)
            throw new Error(`No such reservation with restId = ${restId}`);
        return result;
    }, cb);
    // return result;
}

function getReservation(restId, resId, cb) {
    /* let result = reservations.map(r => r.payload).filter(a => a.restaurantId === restId && a.id === resId);
    if (result.length === 1)
        return result[0];
    return null; */
    return Promisify(() => {
        let result = eventStore[restId].events.map(r => r.payload).filter(a => a.id == resId);
        if (result.length === 1)
            result = result[0];
        else
            result = null;
        if (!result)
            throw new Error(`No such reservation with restId = ${restId} and resId = ${resId}`);
        return result;
    }, cb);
}

function reset() {
    //  eventStore = [];
    eventStore = {};
    snapshots = {};
}

function resetEmitter() {
    emitter.eventNames().forEach(e => emitter.removeAllListeners(e));
}

module.exports = {
    save,
    reservationPending,
    reservationAccepted,
    reservationFailed,
    getPreviousPendingResCount,
    getPreviousPendingRes,
    getReservationsFromDateToDate,
    getReservations,
    getReservation,
    getTables,
    persist,
    publishEvent,
    emit,
    on,
    getStream,
    getSnapshot,
    reset,
    resetEmitter,
};
