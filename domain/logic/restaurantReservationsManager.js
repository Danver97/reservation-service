const Promisify = require('promisify-cb');
const Utils = require('../../lib/utils');
const ReservationError = require('../errors/reservation_error');
const ReservationManagerError = require('../errors/reservationManager_error');
const RepositoryError = require('../../infrastructure/repository/errors/RepositoryError');

const hours = Utils.hours;
const mins = Utils.mins;
const optimisticLocking = Utils.optimisticLocking;

let repo = null;

class ReservationManager {
    constructor(repo) {
        this.repo = repo;
    }

    reservationCreated(reservation, cb) {
        return optimisticLocking(async error => {
            try {
                await this.repo.getReservations(reservation.restId)
                await this.repo.reservationCreated(reservation);
            } catch (e) {
                if (e instanceof RepositoryError && e.code === RepositoryError.eventStreamDoesNotExistErrorCode)
                    throw ReservationManagerError.restaurantDoesNotExistError('Restaurant doesn\'t exist');
                error();
            }
            return reservation;
        }, cb);
    }
    
    reservationConfirmed(resId, table, effectiveDate, cb) {
        return optimisticLocking(async error => {
            const r = await this.repo.getReservation(resId);
            try {
                r.accepted(table, effectiveDate);
                await this.repo.reservationConfirmed(r);
            } catch (e) {
                if (e instanceof ReservationError)
                    console.log('Reservation already cancelled');
                else // RepositoryError
                    error();
            }
            return r;
        }, cb);
    }
    
    reservationCancelled(resId, cb) {
        return optimisticLocking(async error => {
            const r = await this.repo.getReservation(resId);
            r.cancelled();
            try {
                await this.repo.reservationCancelled(r);
            } catch (e) {
                error();
            }
            return r;
        }, cb);
    }
    
    restaurantReservationsCreated(rr, cb) {
        return optimisticLocking(async error => {
            try {
                await this.repo.restaurantReservationsCreated(rr);
            } catch (e) {
                error();
            }
            return rr;
        }, cb);
    }
    
    getReservationWithin3Hours(tableReservations, reservation) {
        const within3Hours = [];
        for (let i = 0; i < tableReservations.length; i++) {
            if (reservation.date.getTime() - hours(1) - mins(30) <= tableReservations[i].date.getTime()
            && reservation.date.getTime() + hours(1) + mins(30) >= tableReservations[i].date.getTime())
                within3Hours.push(tableReservations[i]);
        }
        return within3Hours;
    }
    
    computeTable(tables, reservation) {
        let table = null;
        let effectiveDate = null;
        for (let i = 0; i < tables.length; i++) {
            const tableReservations = this.getReservationWithin3Hours(tables[i].getReservations(), reservation);
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
    
    acceptReservation(restId, resId) {
        return Promisify(async () => {
            // let r = reservation;
            const rr = await this.repo.getReservations(restId);
            const r = await this.repo.getReservation(resId);
            const tables = rr.getTables(r.people);
            const result = this.computeTable(tables, r);
            if (result.table) {
                r.accepted(result.table, result.effectiveDate);
                await this.repo.reservationAdded(rr, r);
            } else
                r.rejected();
            return r;
        });
    }
    
    reservationRemoved(restId, resId) {
        return Promisify(async () => {
            const rr = await this.repo.getReservations(restId);
            rr.reservationRemoved(resId);
            await this.repo.reservationRemoved(rr, resId);
            return resId;
        });
    }
}

function exportFunc(db) {
    repo = db;
    return new ReservationManager(db);
    /* return {
        reservationCreated,
        reservationConfirmed,
        reservationCancelled,
        restaurantReservationsCreated,
        acceptReservation,
        reservationRemoved,
    }; */
}

module.exports = exportFunc;
