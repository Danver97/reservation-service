const Promisify = require('promisify-cb');
const Utils = require('../../lib/utils');
const ReservationError = require('../errors/reservation_error');
const ReservationManagerError = require('../errors/reservationManager_error');
const RepositoryError = require('../../infrastructure/repository/errors/RepositoryError');

const hours = Utils.hours;
const mins = Utils.mins;
const optimisticLocking = Utils.optimisticLocking;

let repo = null;

function reservationCreated(reservation, cb) {
    return optimisticLocking(async error => {
        try {
            await repo.getReservations(reservation.restId);
            await repo.reservationCreated(reservation);
        } catch (e) {
            if (e instanceof RepositoryError && e.code === RepositoryError.eventStreamDoesNotExist)
                throw new ReservationManagerError('Restaurant doesn\'t exist', ReservationManagerError.restaurantDoesNotExist);
            error();
        }
        return reservation;
    }, cb);
}

function reservationConfirmed(resId, table, effectiveDate, cb) {
    return optimisticLocking(async error => {
        const r = await repo.getReservation(resId);
        try {
            r.accepted(table, effectiveDate);
            await repo.reservationConfirmed(r);
        } catch (e) {
            if (e instanceof ReservationError)
                console.log('Reservation already cancelled');
            else // RepositoryError
                error();
        }
        return r;
    }, cb);
}

function reservationCancelled(resId, cb) {
    return optimisticLocking(async error => {
        const r = await repo.getReservation(resId);
        r.cancelled();
        try {
            await repo.reservationCancelled(r);
        } catch (e) {
            error();
        }
        return r;
    }, cb);
}

function restaurantReservationsCreated(rr, cb) {
    return optimisticLocking(async error => {
        try {
            await repo.restaurantReservationsCreated(rr);
        } catch (e) {
            error();
        }
        return rr;
    }, cb);
}

function getReservationWithin3Hours(tableReservations, reservation) {
    const within3Hours = [];
    for (let i = 0; i < tableReservations.length; i++) {
        if (reservation.date.getTime() - hours(1) - mins(30) <= tableReservations[i].date.getTime()
        && reservation.date.getTime() + hours(1) + mins(30) >= tableReservations[i].date.getTime())
            within3Hours.push(tableReservations[i]);
    }
    return within3Hours;
}

function computeTable(tables, reservation) {
    let table = null;
    let effectiveDate = null;
    // console.log('tables.length');
    // console.log(tables.length);
    for (let i = 0; i < tables.length; i++) {
        const tableReservations = getReservationWithin3Hours(tables[i].getReservations(), reservation);
        // console.log('tableReservations');
        // console.log(tableReservations);
        if (tableReservations.length >= 3)
            continue;
        else if (tableReservations.length === 2) {
            const prev = tableReservations[0];
            const next = tableReservations[1];
            if (prev.date.getTime() + hours(1) <= reservation.date.getTime()
            && reservation.date.getTime() + hours(1) <= next.date.getTime()) {
                effectiveDate = reservation.date.getTime();
                table = tables[i];
                break;
            } else if (prev.date.getTime() + hours(1) <= reservation.date.getTime() - mins(15)
                       && next.date.getTime() >= reservation.date.getTime() + hours(1) - mins(15)) {
                table = tables[i];
                effectiveDate = reservation.date.getTime() - mins(15);
                break;
            } else if (prev.date.getTime() + hours(1) <= reservation.date.getTime() + mins(15)
                       && next.date.getTime() >= reservation.date.getTime() + hours(1) + mins(15)) {
                table = tables[i];
                effectiveDate = reservation.date.getTime() + mins(15);
                break;
            }
        } else if (tableReservations.length === 1) {
            const res = tableReservations[0];
            if (res.date.getTime() + hours(1) <= reservation.date.getTime() || res.date.getTime() >= reservation.date.getTime() + hours(1)) {
                table = tables[i];
                effectiveDate = null;
                break;
            } else if (res.date.getTime() < reservation.date.getTime()
            && res.date.getTime() + hours(1) <= reservation.date.getTime() + mins(15)) {
                table = tables[i];
                effectiveDate = reservation.date.getTime() + mins(15);
                break;
            } else if (res.date.getTime() > reservation.date.getTime()
            && res.date.getTime() >= reservation.date.getTime() + hours(1) - mins(15)) {
                table = tables[i];
                effectiveDate = reservation.date.getTime() - mins(15);
                break;
            }
        } else if (tableReservations.length === 0) {
            effectiveDate = reservation.date.getTime();
            table = tables[i];
            break;
        }
    }
    return {
        table,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
    };
}

function acceptReservation(restId, reservation) {
    return Promisify(async () => {
        const rr = await repo.getReservations(restId);
        // const r = await repo.getReservation(reservation.id);
        const tables = rr.getTables(reservation.people);
        const result = computeTable(tables, reservation);
        // console.log('result');
        // console.log(result);
        if (result.table) {
            reservation.accepted(result.table, result.effectiveDate);
            await repo.reservationAdded(rr, reservation);
        } else
            reservation.rejected();
        return reservation;
    });
}

function reservationRemoved(restId, resId) {
    return Promisify(async () => {
        const rr = await repo.getReservations(restId);
        rr.reservationRemoved(resId);
        await repo.reservationRemoved(rr, resId);
        return resId;
    });
}

function exportFunc(db) {
    repo = db;
    return {
        reservationCreated,
        reservationConfirmed,
        reservationCancelled,
        restaurantReservationsCreated,
        acceptReservation,
        reservationRemoved,
    };
}

module.exports = exportFunc;
