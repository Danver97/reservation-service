const ReservationEvents = require('../../lib/reservation-events');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
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

/*
function getReservationsFromDateToDate(restId, fromDate, toDate, cb) {
    return Promisify(async () => {
        const stream = await this.getStream(restId);
        return stream.map(r => r.payload)
            .filter(a => a.status === 'accepted' && a.date.getTime() >= fromDate.getTime() && a.date.getTime() <= toDate.getTime());
    }, cb);
}
*/

function restaurantReservationsCreated(rr, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.restaurantReservationsCreated, { restId: rr.restId, timeTable: rr.timeTable }, cb);
}

function reservationFailed(rr, reservation, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationFailed, Object.assign({}, reservation), cb);
}

function reservationAccepted(rr, reservation, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationAccepted, Object.assign({}, reservation), cb);
}

function reservationCancelled(rr, reservation, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationCancelled, Object.assign({}, reservation), cb);
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
        // const now = new Date(Date.now());
        // now.setMinutes(now.getMinutes() - 30);
        const stream = await this.getStream(restId);
        let rr;
        stream.forEach(e => {
            if (e.message === ReservationEvents.restaurantReservationsCreated)
                rr = new RestaurantReservations(e.payload.restId, e.payload.timeTable);
            if (e.message === ReservationEvents.reservationFailed)
                rr.reservationFailed(Reservation.fromObject(e.payload));
            if (e.message === ReservationEvents.reservationAccepted)
                rr.reservationAccepted(Reservation.fromObject(e.payload));
            if (e.message === ReservationEvents.reservationCancelled)
                rr.reservationCancelled(Reservation.fromObject(e.payload).id);
        });
        if (!rr)
            throw new Error(`No such reservation with restId = ${restId}`);
        rr._revisionId = stream.length;
        // console.log(rr);
        return rr;
    }, cb);
}


function exportFunc(db) {
    return Object.assign(db, {
        restaurantReservationsCreated: restaurantReservationsCreated.bind(db),
        reservationFailed: reservationFailed.bind(db),
        reservationAccepted: reservationAccepted.bind(db),
        reservationCancelled: reservationCancelled.bind(db),
        // getReservationsFromDateToDate: getReservationsFromDateToDate.bind(db),
        getTables: getTables.bind(db),
        getReservations: getReservations.bind(db),
    });
}

module.exports = exportFunc;
