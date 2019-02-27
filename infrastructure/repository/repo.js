const Promisify = require('promisify-cb');
const ReservationEvents = require('../../lib/reservation-events');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const Table = require('../../domain/models/table');

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

function reservationCreated(reservation, cb) {
    return this.save(reservation.id, reservation._revisionId, ReservationEvents.reservationCreated, Object.assign({}, reservation), cb);
}

function reservationConfirmed(reservation, cb) {
    const payload = {
        resId: reservation.id,
        status: 'confirmed',
        table: reservation.table,
        date: reservation.date,
    };
    return this.save(reservation.id, reservation._revisionId, ReservationEvents.reservationConfirmed, payload, cb);
}

function reservationRejected(reservation, cb) {
    const payload = { resId: reservation.id, status: 'rejected' };
    return this.save(reservation.id, reservation._revisionId, ReservationEvents.reservationRejected, payload, cb);
}

function reservationCancelled(reservation, cb) {
    const payload = { resId: reservation.id, status: 'cancelled' };
    return this.save(reservation.id, reservation._revisionId, ReservationEvents.reservationCancelled, payload, cb);
}

function restaurantReservationsCreated(rr, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.restaurantReservationsCreated,
        { restId: rr.restId, timeTable: rr.timeTable, tables: rr.tables }, cb);
}
// **Deprecated**
function reservationFailed(rr, reservation, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationFailed, Object.assign({}, reservation), cb);
}
// **Deprecated**
function reservationAccepted(rr, reservation, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationAccepted, Object.assign({}, reservation), cb);
}

function reservationAdded(rr, reservation, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationAdded, Object.assign({}, reservation), cb);
}

function reservationRemoved(rr, reservation, cb) {
    return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationRemoved, { restId: rr.restId, resId: reservation.id }, cb);
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

function getReservation(resId, cb) {
    return Promisify(async () => {
        const stream = await this.getStream(resId);
        let r;
        stream.forEach(e => {
            const payload = e.payload;
            switch (e.message) {
                case ReservationEvents.reservationCreated:
                    r = Reservation.fromObject(payload);
                    break;
                case ReservationEvents.reservationConfirmed:
                    r.accepted(payload.table, payload.date);
                    break;
                case ReservationEvents.reservationRejected:
                    r.rejected();
                    break;
                case ReservationEvents.reservationCancelled:
                    r.cancelled();
                    break;
                default:
            }
        });
        if (!r)
            throw new Error(`No such reservation with resId = ${resId}`);
        r._revisionId = stream.length;
        // console.log(r);
        return r;
    }, cb);
}

function getReservations(restId, cb) {
    return Promisify(async () => {
        // const now = new Date(Date.now());
        // now.setMinutes(now.getMinutes() - 30);
        const stream = await this.getStream(restId);
        let rr;
        stream.forEach(e => {
            const payload = e.payload;
            switch (e.message) {
                case ReservationEvents.restaurantReservationsCreated:
                    rr = new RestaurantReservations(payload.restId, payload.timeTable, payload.tables);
                    break;
                case ReservationEvents.reservationAdded:
                    rr.reservationAdded(Reservation.fromObject(payload));
                    break;
                case ReservationEvents.reservationRemoved:
                    rr.reservationRemoved(payload.resId);
                    break;
                default:
            }
            /* if (e.message === ReservationEvents.restaurantReservationsCreated)
                rr = new RestaurantReservations(e.payload.restId, e.payload.timeTable);
            if (e.message === ReservationEvents.reservationFailed)
                rr.reservationFailed(Reservation.fromObject(e.payload));
            if (e.message === ReservationEvents.reservationAccepted)
                rr.reservationAccepted(Reservation.fromObject(e.payload));
            if (e.message === ReservationEvents.reservationCancelled)
                rr.reservationCancelled(Reservation.fromObject(e.payload).id); */
        });
        if (!rr)
            throw new Error(`No such restaurant reservations with restId = ${restId}`);
        rr._revisionId = stream.length;
        // console.log(rr);
        return rr;
    }, cb);
}


function exportFunc(db) {
    return Object.assign(db, {
        // Reservations
        reservationCreated: reservationCreated.bind(db),
        reservationConfirmed: reservationConfirmed.bind(db),
        reservationRejected: reservationRejected.bind(db),
        reservationCancelled: reservationCancelled.bind(db),
        // RestaurantReservations
        restaurantReservationsCreated: restaurantReservationsCreated.bind(db),
        reservationFailed: reservationFailed.bind(db), // **Deprecated**
        reservationAccepted: reservationAccepted.bind(db), // **Deprecated**
        reservationAdded: reservationAdded.bind(db),
        reservationRemoved: reservationRemoved.bind(db),
        // getReservationsFromDateToDate: getReservationsFromDateToDate.bind(db),
        getTables: getTables.bind(db),
        getReservation: getReservation.bind(db),
        getReservations: getReservations.bind(db),
    });
}

module.exports = exportFunc;
