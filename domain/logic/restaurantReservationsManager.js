const Promisify = require('promisify-cb');
const Utils = require('../../lib/utils');
const RestaurantReservations = require('../models/restaurantReservations');
const RestaurantReservationsError = require('../errors/restaurantReservations_error');
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

    _optimisticLocking(action, cb) {
        return optimisticLocking(async error => {
            try {
                const result = await action();
                return result;
            } catch (e) {
                if (e instanceof RepositoryError && e.code === RepositoryError.optimisticLockErrorCode) {
                    error();
                    return;
                }
                if (e instanceof RepositoryError && e.code === RepositoryError.eventStreamDoesNotExistErrorCode)
                    throw ReservationManagerError.restaurantDoesNotExistError('Restaurant doesn\'t exist');
                if (e instanceof ReservationError)
                    console.log('Reservation already cancelled');
                throw e;
            }
        });
    }

    reservationCreated(reservation, cb) {
        return this._optimisticLocking(async () => {
            const rr = await this.repo.getReservations(reservation.restId);
            const t = this.repo.startTransaction();
            t.reservationCreated(reservation);

            if (rr.acceptationMode === RestaurantReservations.acceptationModes.MANUAL) {
                await t.commit();
                return reservation;
            }

            try {
                rr.acceptReservation(reservation);
                t.reservationConfirmed(reservation);
                t.reservationAdded(rr, reservation);
            } catch (err) {
                if (err instanceof RestaurantReservationsError) {
                    if (err.code === RestaurantReservationsError.reservationNotAcceptableErrorCode) {
                        t.reservationRejected(reservation);
                    } else if (err.code === RestaurantReservationsError.resTooBigForAutoAcceptErrorCode) {
                        // Can't be accepted, does nothing and leaves the reservation to be accepted manually
                    } else throw err;
                } else throw err;
            }

            await t.commit();
            return reservation;
        }, cb);
    }
    
    reservationCancelled(resId, cb) {
        return this._optimisticLocking(async () => {
            const r = await this.repo.getReservation(resId);
            const rr = await this.repo.getReservations(r.restId);

            
            const t = this.repo.startTransaction();
            const wasConfirmed = r.isConfirmed;
            r.cancelled();
            t.reservationCancelled(r);
            if (wasConfirmed) {
                rr.removeReservation(r.id);
                t.reservationRemoved(rr, r.id);
            }
            await t.commit();

            // await this.repo.reservationCancelled(r);
            return r;
        }, cb);
    }
    
    restaurantReservationsCreated(rr, cb) {
        return optimisticLocking(async () => {
            await this.repo.restaurantReservationsCreated(rr);
            return rr;
        }, cb);
    }

    // @deprecated
    getReservationWithin3Hours(tableReservations, reservation) {
        const within3Hours = [];
        for (let i = 0; i < tableReservations.length; i++) {
            if (reservation.date.getTime() - hours(1) - mins(30) <= tableReservations[i].date.getTime()
            && reservation.date.getTime() + hours(1) + mins(30) >= tableReservations[i].date.getTime())
                within3Hours.push(tableReservations[i]);
        }
        return within3Hours;
    }

    // @deprecated
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

    // @deprecated
    async _acceptReservation(rr, r) {
        const tables = rr.getTables(r.people);
        const result = this.computeTable(tables, r);
        if (result.table) {
            r.accepted(result.table, result.effectiveDate);
            await this.repo.reservationAdded(rr, r);
        } else
            r.rejected();
        return r;
    }

    /* async _acceptResByNumber(rr, r) {
        try {
            const t = this.repo.startTransaction();
            r.confirmed();
            t.reservationConfirmed(r);
            rr.reservationAdded(r);
            await t.commit();
        } catch (err) {
            
        }
    } */
    
    acceptReservation(restId, resId) {
        return Promisify(async () => {
            const rr = await this.repo.getReservations(restId);
            const r = await this.repo.getReservation(resId);

            const t = this.repo.startTransaction();
            t.reservationConfirmed(r);

            if (rr.acceptationMode === RestaurantReservations.acceptationModes.MANUAL) {
                rr.acceptReservation(r);
                t.reservationAdded(rr, r);
            } else {
                rr.acceptReservationManually(r);
                t.reservationAdded(rr, r, true);
            }

            await t.commit();
            // return await this._acceptReservation(rr, r);
            return r;
        });
    }
}


/* function resCreated(res) {
    const rr = repo.getRR();
    switch (rr.acceptPolicy) {
        case 'manual':
            manual(rr, res);
            break;
        case 'auto_number':
            auto_number(rr, res);
            break;
        case 'auto_tables':
            auto_tables(rr, res);
            break;
    }
}

function manual(rr, res) {
    repo.resCreated(res);
}
function auto_number(rr, res) {
    const t = repo.startTransaction();
    t.resCreated(res);
    try {
        rr.add(res);
        t.resConfirmed(res);
        t.resAdded(res);
    } catch (e) {
        t.resReject(res);
    }
    t.commit();
}
function auto_tables(rr, res) {
    const t = repo.startTransaction();
    t.resCreated(res);
    try {
        rr.add(res);
        t.resConfirmed(res);
        t.resAdded(res);
    } catch (e) {
        t.resReject(res);
    }
    t.commit();
} */

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
