const pact = require('@pact-foundation/pact');
const eventContentUtils = require('../../../contract-testing-utils').eventContentUtils;

const { like, iso8601DateTimeWithMillis } = pact.Matchers;
const likeUuid = pact.Matchers.uuid;

function reservationCreatedEvent(eventId, reservation) {
    return eventContentUtils.basicEvent(reservation.id, eventId, 'reservationCreated', {
        restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
        userId: likeUuid(reservation.userId),
        reservationName: like(reservation.reservationName),
        status: 'pending',
        people: like(reservation.people),
        date: iso8601DateTimeWithMillis(reservation.date.toJSON()),
    });
}

function reservationConfirmedEvent(eventId, reservation) {
    return eventContentUtils.basicEvent(reservation.id, eventId, 'reservationConfirmed', {
        resId: likeUuid(reservation.id),
        status: 'confirmed',
        table: eventContentUtils.matchers.likeTable(r.table.id, r.table.people),
        date: iso8601DateTimeWithMillis(reservation.date.toJSON()),
    });
}

function reservationCancelledEvent(eventId, reservation) {
    return eventContentUtils.basicEvent(reservation.id, eventId, 'reservationConfirmed', {
        resId: likeUuid(reservation.id),
        status: 'cancelled',
    });
}

function restaurantReservationsCreatedEvent(eventId, restId, owner) {
    return eventContentUtils.basicEvent(restId, eventId, 'restaurantReservationsCreated', {
        restId: likeUuid(restId),
        owner: like(owner),
        tables: eventContentUtils.matchers.likeTables(restId),
        timeTable: eventContentUtils.matchers.likeTimeTable(),
    });
}

function reservationAddedEvent(eventId, reservation) {
    const r = reservation
    return eventContentUtils.basicEvent(reservation.restId, eventId, 'reservationAdded', {
        restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
        table: eventContentUtils.matchers.likeTable(r.table.id, r.table.people),
        date: iso8601DateTimeWithMillis(reservation.date.toJSON()),
    });
}

function reservationRemovedEvent(eventId, reservation) {
    return eventContentUtils.basicEvent(reservation.id, eventId, 'reservationRemoved', {
        restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
    });
}

module.exports = {
    reservationCreatedEvent,
    reservationConfirmedEvent,
    reservationCancelledEvent,
    restaurantReservationsCreatedEvent,
    reservationAddedEvent,
    reservationRemovedEvent,
};
