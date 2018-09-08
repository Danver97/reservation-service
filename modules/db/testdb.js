const Table = require("../../models/table");

var restaturants = [
    {
        restId: 1,
        tables: [
            new Table(1, 1, 2),
            new Table(2, 1, 3),
            new Table(3, 1, 4),
            new Table(4, 1, 4),
            new Table(5, 1, 4),
            new Table(6, 1, 6)
        ]
    },
    {
        restId: 2,
        tables: [
            new Table(1, 2, 2),
            new Table(3, 2, 4),
            new Table(2, 2, 3),
            new Table(4, 2, 4),
            new Table(5, 2, 6)
        ]
    },
];
var eventCode = 0;
// var reservations = [];
let eventStore = {};

function save(streamId, message, payload, cb) {
    return new Promise((resolve, reject) => {
        if (!eventStore[streamId])
            eventStore[streamId] = { streamId, revision: 0, events: [] };
        const revision = eventStore[streamId].revision;
        const event = {
            eventId: eventCode,
            event: message,
            payload: Object.assign({}, payload)
        };
        let err = null;
        if(revision !== eventStore[streamId].revision)
            err = new Error('Wrong revision!');
        else
            eventStore[streamId].events.push(event);
        eventCode++;
        if(cb && typeof cb === 'function')
            cb(err, eventCode);
        if(err) 
            reject(err);
        else
            resolve(eventCode);
    });
}

function reservationPending(restId, payload, cb) {
  return save(restId, 'reservationPending', payload, cb);
}

function reservationAccepted(restId, payload, cb) {
  return save(restId, 'reservationAccepted', payload, cb);
}

function reservationFailed(restId, payload, cb) {
  return save(restId, 'reservationFailed', payload, cb);
}

function getPreviousPendingResCount(restId, created, date) {
    return new Promise((resolve, reject) => {
        //previous code;
        // console.log(eventStore[restId].events);
        let pending = eventStore[restId].events.map(r => r.payload).filter((a) => {
            return a.status == "pending" && a.created.getTime() < created.getTime() && a.date.getTime() + hours(1) + mins(15) >= date.getTime();
        });

        let accepted = eventStore[restId].events.map(r => r.payload).filter((a) => {
            return a.status == "accepted" && a.created.getTime() < created.getTime();
        });
        let result = pending.filter((a) => {
            return !(accepted.filter((b) => b.id == a.id).length >= 1);
        });
        
        const err = null;
        if(err)
            reject(err);
        else
            resolve(result.length);
    });
    //return result.length;
}

function getPreviousPendingRes(restId, created, date) {
    return new Promise((resolve, reject) => {
        //previous code;
        let pending = eventStore[restId].events.map(r => r.payload).filter((a) => {
            return a.status == "pending" && a.created.getTime() < created.getTime() && ((a.date.getTime() + hours(1) + mins(15) > date.getTime() && a.date.getTime() <= date.getTime()) || (a.date.getTime() - mins(15) < date.getTime() + hours(1) && a.date.getTime() >= date.getTime()));
        });

        let accepted = eventStore[restId].events.map(r => r.payload).filter((a) => {
            return a.status == "accepted" && a.created.getTime() < created.getTime();
        });

        let failed = eventStore[restId].events.map(r => r.payload).filter((a) => {
            return a.status == "failed" && a.created.getTime() < created.getTime();
        });

        pending = pending.filter((a) => {
            return !(accepted.filter((b) => {
                return b.id == a.id;
            }).length >= 1) && !(failed.filter((b) => {
                return b.id == a.id;
            }).length >= 1);
        });
        const result = {};
        let max = 0;
        pending.forEach((p) => {
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
        
        const err = null;
        if(err)
            reject(err);
        else
            resolve(result);
    });
    //return result;
}

function getReservationsFromDateToDate(restId, fromDate, toDate) {
    return new Promise((resolve, reject) => {
        //previous code;
        const result = eventStore[restId].events.map(r => r.payload).filter(function (a) {
            return a.status == "accepted" && a.date.getTime() >= fromDate.getTime() &&
                a.date.getTime() <= toDate.getTime();
        });
        //console.log(result);
        const err = null;
        if(err)
            reject(err);
        else
            resolve(result);
    });
    //return result;
}

function getTables(restId) {
    /*let rests = restaturants.filter((r) => {
        return r.restId == restId
    });
    if (rests.length >= 1) {
        return rests[0].tables;
    } else
        throw new Error("no restaurant with id " + restId);*/
    return new Promise((resolve, reject) => {
        //previous code;
        let result;
        let rests = restaturants.filter((r) => {
            return r.restId == restId
        });
        const err = null;
        try {
            if (rests.length >= 1) {
                result = rests[0].tables;
            } else
                throw new Error("no restaurant with id " + restId);
        } catch(e) {
            err = e;
        }
        if(err)
            reject(err);
        else
            resolve(result);
    });
}

function getReservations(restId) {
    return new Promise((resolve, reject) => {
        //previous code;
        let now = new Date(Date.now());
        now.setMinutes(now.getMinutes() - 30);
        let result = eventStore[restId].events.map(r => r.payload).filter(a => a.status === "accepted" && a.date.getTime() >= now.getTime());
        if (result.length === 0)
            result = null;
        
        const err = null;
        if(err)
            reject(err);
        else if(!result)
            reject({error: `No such reservation with restId = ${restId}`});
        else
            resolve(result);
    });
    //return result;
}

function getReservation(restId, resId) {
    /*let result = reservations.map(r => r.payload).filter(a => a.restaurantId === restId && a.id === resId);
    if (result.length === 1)
        return result[0];
    return null;*/
    return new Promise((resolve, reject) => {
        let result = eventStore[restId].events.map(r => r.payload).filter(a => a.id == resId);
        if (result.length === 1)
            result = result[0];
        else
            result = null;
        const err = null;
        if(err)
            reject(err);
        else if(!result)
            reject({error: `No such reservation with restId = ${restId} and resId = ${resId}`});
        else
            resolve(result);
    });
}

function reset() {
    // eventStore = [];
    eventStore = {};
}

function mins(qty) {
    return qty * 60 * 1000;
}

function hours(qty) {
    return mins(qty * 60);
}

module.exports = {
    save,
    reservationPending,
    reservationAccepted,
    reservationFailed,
    getPreviousPendingResCount,
    getPreviousPendingRes,
    getReservationsFromDateToDate: getReservationsFromDateToDate,
    getReservations,
    getReservation,
    getTables,
    reset,
}
