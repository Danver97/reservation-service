const Promisify = require('promisify-cb');
const ReservationEvents = require('../../lib/reservation-events');
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const RepositoryError = require('./errors/RepositoryError');
const Event = require('@danver97/event-sourcing/event');
const EventStoreError = require('@danver97/event-sourcing/eventStore/errors/event_store.error');

function toJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

class RepositoryManager {
    constructor(db) {
        this.db = db;
    }

    startTransaction() {
        return new RepositoryManagerTransaction(this.db);
    }

    async save(streamId, eventId = 0, message, payload) {
        try {
            await this.db.save(streamId, eventId, message, payload);
        } catch (err) {
            if (err instanceof EventStoreError
                && (err.code === EventStoreError.streamRevisionNotSyncErrorCode || err.code === EventStoreError.eventAlreadyExistsErrorCode))
                throw RepositoryError.optimisticLockError();
            throw err;
        }
    }

    // Reservation
    reservationCreated(reservation, cb) {
        if (!reservation)
            throw RepositoryError.paramError(`Missing the following parameters:${reservation ? '' : ' reservation'}`);
        const payload = Object.assign({}, reservation);
        payload.resId = reservation.id;
        delete payload.id;
        return this.save(reservation.id, reservation._revisionId, ReservationEvents.reservationCreated, payload, cb);
    }

    reservationConfirmed(reservation, cb) {
        if (!reservation)
            throw RepositoryError.paramError(`Missing the following parameters:${reservation ? '' : ' reservation'}`);
        const payload = {
            restId: reservation.restId,
            resId: reservation.id,
            status: 'confirmed',
            table: reservation.table,
            date: reservation.date,
        };
        return this.save(reservation.id, reservation._revisionId, ReservationEvents.reservationConfirmed, payload, cb);
    }

    reservationRejected(reservation, cb) {
        if (!reservation)
            throw RepositoryError.paramError(`Missing the following parameters:${reservation ? '' : ' reservation'}`);
        const payload = { restId: reservation.restId, resId: reservation.id, status: 'rejected' };
        return this.save(reservation.id, reservation._revisionId, ReservationEvents.reservationRejected, payload, cb);
    }

    reservationCancelled(reservation, cb) {
        if (!reservation)
            throw RepositoryError.paramError(`Missing the following parameters:${reservation ? '' : ' reservation'}`);
        const payload = { restId: reservation.restId, resId: reservation.id, status: 'cancelled' };
        return this.save(reservation.id, reservation._revisionId, ReservationEvents.reservationCancelled, payload, cb);
    }


    reservationCreatedConfirmedAndAdded(rr, reservation, cb) {
        if (!rr || !reservation)
            throw RepositoryError.paramError(`Missing the following parameters:${rr ? '' : ' rr'}${reservation ? '' : ' reservation'}`);
        const payloadCreated = Object.assign({}, reservation);
        payloadCreated.resId = reservation.id;
        delete payloadCreated.id;
        payloadCreated.status = 'created';
        delete payloadCreated.table;
        const reservationCreatedEvent = new Event(reservation.id, reservation._revisionId, ReservationEvents.reservationCreated, payloadCreated, cb);

        const payloadConfirmed = {
            restId: reservation.restId,
            resId: reservation.id,
            status: 'confirmed',
            table: reservation.table,
            date: reservation.date,
        };
        const reservationConfirmedEvent = new Event(reservation.id, reservation._revisionId, ReservationEvents.reservationConfirmed, payloadConfirmed);

        const payloadAdded = Object.assign({}, reservation);
        payloadAdded.resId = reservation.id;
        const reservationAddedEvent = new Event(rr.restId, rr._revisionId, ReservationEvents.reservationAdded, payloadAdded);
        return this.saveEventsTransactionally([reservationCreatedEvent, reservationConfirmedEvent, reservationAddedEvent], cb);
    }

    reservationConfirmedAndAdded(rr, reservation, cb) {
        if (!rr || !reservation)
            throw RepositoryError.paramError(`Missing the following parameters:${rr ? '' : ' rr'}${reservation ? '' : ' reservation'}`);
        const payloadConfirmed = {
            restId: reservation.restId,
            resId: reservation.id,
            status: 'confirmed',
            table: reservation.table,
            date: reservation.date,
        };
        const reservationConfirmedEvent = new Event(reservation.id, reservation._revisionId, ReservationEvents.reservationConfirmed, payloadConfirmed);
        const payloadAdded = Object.assign({}, reservation);
        payloadAdded.resId = reservation.id;
        const reservationAddedEvent = new Event(rr.restId, rr._revisionId, ReservationEvents.reservationAdded, payloadAdded);
        return this.saveEventsTransactionally([reservationConfirmedEvent, reservationAddedEvent], cb);
    }

    reservationCancelledAndRemoved(rr, reservation, cb) {
        if (!rr || !reservation)
            throw RepositoryError.paramError(`Missing the following parameters:${rr ? '' : ' rr'}${reservation ? '' : ' reservation'}`);
        const payloadCancelled = { restId: reservation.restId, resId: reservation.id, status: 'cancelled' };
        const reservationCancelledEvent = new Event(reservation.id, reservation._revisionId, ReservationEvents.reservationCancelled, payloadCancelled);
        const payloadRemoved = { restId: rr.restId, resId }
        const reservationRemovedEvent = new Event(rr.restId, rr._revisionId, ReservationEvents.reservationRemoved, payloadRemoved);
        return this.saveEventsTransactionally([reservationCancelledEvent, reservationRemovedEvent], cb);
    }

    // RestaurantReservations
    restaurantReservationsCreated(rr, cb) {
        if (!rr)
            throw RepositoryError.paramError(`Missing the following parameters:${rr ? '' : ' rr'}`);
        // const payload = { restId: rr.restId, timeTable: rr.timeTable, tables: rr.tables, threshold: rr.threshold };
        const payload = toJSON(rr);
        return this.save(rr.restId, rr._revisionId, ReservationEvents.restaurantReservationsCreated,
            payload, cb);
    }

    reservationAdded(rr, reservation, enforced, cb) {
        if (!rr || !reservation)
            throw RepositoryError.paramError(`Missing the following parameters:${rr ? '' : ' rr'}${reservation ? '' : ' reservation'}`);
        const payload = Object.assign({}, reservation);
        payload.resId = reservation.id;
        if (enforced)
            payload.enforced = enforced;
        return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationAdded, payload, cb);
    }

    reservationRemoved(rr, resId, cb) {
        if (!rr || !resId) {
            throw RepositoryError.paramError(`Missing the following parameters:${rr ? '' : ' rr'}${resId ? '' : ' resId'}`);
        }
        return this.save(rr.restId, rr._revisionId, ReservationEvents.reservationRemoved, { restId: rr.restId, resId }, cb);
    }

    // Getters
    /**
     * Rebuilds a Reservation from stream of events
     * @param {string} resId Reservation id
     * @param {function} cb Asynchronous callback
     * @returns {Reservation}
     */
    getReservation(resId, cb) {
        if (!resId)
            throw RepositoryError.paramError(`Missing the following parameters:${resId ? '' : ' resId'}`);
        return Promisify(async () => {
            const stream = await this.db.getStream(resId);
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
                throw RepositoryError.eventStreamDoesNotExistError(`No such reservation with resId = ${resId}`);
            r._revisionId = stream.length;
            // console.log(r);
            return r;
        }, cb);
    }

    /**
     * Rebuilds a RestaurantReservations from stream of events
     * @param {string} restId RestaurantReservations id
     * @param {function} cb Asynchronous callback
     * @returns {RestaurantReservations}
     */
    getReservations(restId, cb) {
        if (!restId)
            throw RepositoryError.paramError(`Missing the following parameters:${restId ? '' : ' restId'}`);
        return Promisify(async () => {
            const stream = await this.db.getStream(restId);
            let rr;
            stream.forEach(e => {
                const payload = e.payload;
                switch (e.message) {
                    case ReservationEvents.restaurantReservationsCreated:
                        rr = new RestaurantReservations(payload);
                        break;
                    case ReservationEvents.reservationAdded:
                        payload.status = Reservation.statuses.pending;
                        const enforced = payload.enforced;
                        delete payload.enforced;
                        if (enforced)
                            rr.acceptReservationManually(Reservation.fromObject(payload));
                        else
                            rr.acceptReservation(Reservation.fromObject(payload));
                        break;
                    case ReservationEvents.reservationRemoved:
                        rr.removeReservation(payload.resId);
                        break;
                    default:
                }
            });
            if (!rr)
                throw RepositoryError.eventStreamDoesNotExistError(`No such restaurant reservations with restId = ${restId}`);
            rr._revisionId = stream.length;
            // console.log(rr);
            return rr;
        }, cb);
    }

    reset() {
        this.db.reset();
    }
}

class RepositoryManagerTransaction extends RepositoryManager {
    constructor(db) {
        super(db);
        this.buffer = [];
        this.streamRevisions = {};
    }
    save(streamId, eventId = 0, message, payload, cb) {
        if (!this.streamRevisions[streamId])
            this.streamRevisions[streamId] = eventId || 0;
        this.streamRevisions[streamId]++;
        this.buffer.push(new Event(streamId, this.streamRevisions[streamId], message, payload));
    }

    commit() {
        // console.log(this.buffer.map(e => ({ streamId: e.streamId, eventId: e.eventId })));
        return this.db.saveEventsTransactionally(this.buffer);
    }
}

module.exports = RepositoryManager;
