const Promisify = require('promisify-cb');
const ReservationEvents = require('../../lib/reservation-events');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const RepositoryError = require('./errors/RepositoryError');

// Reservation
function reservationCreated(reservation, cb) {
    if (!reservation)
        throw new RepositoryError(`Missing the following parameters:${reservation ? '' : ' reservation'}`, RepositoryError.paramError);
        const payload = Object.assign({}, reservation);
        payload.resId = reservation.id;
        delete payload.id;
    return this.save(reservation.id, reservation._revisionId || 0, ReservationEvents.reservationCreated, payload, cb);
}

function reservationConfirmed(reservation, cb) {
    if (!reservation)
        throw new RepositoryError(`Missing the following parameters:${reservation ? '' : ' reservation'}`, RepositoryError.paramError);
    const payload = {
        restId: reservation.restId,
        resId: reservation.id,
        status: 'confirmed',
        table: reservation.table,
        date: reservation.date,
    };
    return this.save(reservation.id, reservation._revisionId || 0, ReservationEvents.reservationConfirmed, payload, cb);
}

function reservationRejected(reservation, cb) {
    if (!reservation)
        throw new RepositoryError(`Missing the following parameters:${reservation ? '' : ' reservation'}`, RepositoryError.paramError);
    const payload = { restId: reservation.restId, resId: reservation.id, status: 'rejected' };
    return this.save(reservation.id, reservation._revisionId || 0, ReservationEvents.reservationRejected, payload, cb);
}

function reservationCancelled(reservation, cb) {
    if (!reservation)
        throw new RepositoryError(`Missing the following parameters:${reservation ? '' : ' reservation'}`, RepositoryError.paramError);
    const payload = { restId: reservation.restId, resId: reservation.id, status: 'cancelled' };
    return this.save(reservation.id, reservation._revisionId || 0, ReservationEvents.reservationCancelled, payload, cb);
}

// RestaurantReservations
function restaurantReservationsCreated(rr, cb) {
    if (!rr)
        throw new RepositoryError(`Missing the following parameters:${rr ? '' : ' rr'}`, RepositoryError.paramError);
    return this.save(rr.restId, rr._revisionId || 0, ReservationEvents.restaurantReservationsCreated,
        { restId: rr.restId, timeTable: rr.timeTable, tables: rr.tables }, cb);
}

function reservationAdded(rr, reservation, cb) {
    if (!rr || !reservation) {
        throw new RepositoryError(
            `Missing the following parameters:${rr ? '' : ' rr'}${reservation ? '' : ' reservation'}`,
            RepositoryError.paramError,
        );
    }
    const payload = Object.assign({}, reservation);
    payload.resId = reservation.id;
    return this.save(rr.restId, rr._revisionId || 0, ReservationEvents.reservationAdded, payload, cb);
}

function reservationRemoved(rr, resId, cb) {
    if (!rr || !resId) {
        throw new RepositoryError(
            `Missing the following parameters:${rr ? '' : ' rr'}${resId ? '' : ' resId'}`,
            RepositoryError.paramError,
        );
    }
    return this.save(rr.restId, rr._revisionId || 0, ReservationEvents.reservationRemoved, { restId: rr.restId, resId }, cb);
}

// Getters
function getReservation(resId, cb) {
    if (!resId)
        throw new RepositoryError(`Missing the following parameters:${resId ? '' : ' resId'}`, RepositoryError.paramError);
    return Promisify(async () => {
        const stream = await this.getStream(resId);
        let r;
        stream.forEach(e => {
            const payload = e.payload;
            switch (e.message) {
                case ReservationEvents.reservationCreated:
                    payload.id = payload.resId;
                    delete payload.resId;
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
            throw new RepositoryError(`No such reservation with resId = ${resId}`, RepositoryError.eventStreamDoesNotExist);
        r._revisionId = stream.length;
        // console.log(r);
        return r;
    }, cb);
}

function getReservations(restId, cb) {
    if (!restId)
        throw new RepositoryError(`Missing the following parameters:${restId ? '' : ' restId'}`, RepositoryError.paramError);
    return Promisify(async () => {
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
        });
        if (!rr)
            throw new RepositoryError(`No such restaurant reservations with restId = ${restId}`, RepositoryError.eventStreamDoesNotExist);
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
        reservationAdded: reservationAdded.bind(db),
        reservationRemoved: reservationRemoved.bind(db),
        getReservation: getReservation.bind(db),
        getReservations: getReservations.bind(db),
    });
}

module.exports = exportFunc;
