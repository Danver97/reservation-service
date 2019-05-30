const pact = require('@pact-foundation/pact');
const eventContentUtils = require('../../contract-testing-utils').eventContentUtils;

const { like, iso8601DateTimeWithMillis } = pact.Matchers;
const likeUuid = pact.Matchers.uuid;

let eventId = 0;

function reservationCreatedEvent(reservation, eId) {
    return eventContentUtils.basicEvent(reservation.id, eId || ++eventId, 'reservationCreated', {
        restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
        userId: likeUuid(reservation.userId),
        reservationName: like(reservation.reservationName),
        status: 'pending',
        people: like(reservation.people),
        date: iso8601DateTimeWithMillis(reservation.date.toJSON()),
    });
}

function reservationConfirmedEvent(reservation, eId) {
    return eventContentUtils.basicEvent(reservation.id, eId || ++eventId, 'reservationConfirmed', {
        resId: likeUuid(reservation.id),
        status: 'confirmed',
        table: eventContentUtils.matchers.likeTable(reservation.table.id, reservation.table.people),
        date: iso8601DateTimeWithMillis(reservation.date.toJSON()),
    });
}

function reservationCancelledEvent(reservation, eId) {
    return eventContentUtils.basicEvent(reservation.id, eId || ++eventId, 'reservationCancelled', {
        resId: likeUuid(reservation.id),
        status: 'cancelled',
    });
}

function restaurantReservationsCreatedEvent(rr, eId) {
    return eventContentUtils.basicEvent(rr.restId, eId || ++eventId, 'restaurantReservationsCreated', {
        restId: likeUuid(rr.restId),
        tables: eventContentUtils.matchers.likeTables(rr.restId),
        timeTable: eventContentUtils.matchers.likeTimeTable(),
    });
}

function reservationAddedEvent(reservation, eId) {
    const r = reservation
    return eventContentUtils.basicEvent(reservation.restId, eId || ++eventId, 'reservationAdded', {
        restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
        table: eventContentUtils.matchers.likeTable(reservation.table.id, reservation.table.people),
        date: iso8601DateTimeWithMillis(reservation.date.toJSON()),
    });
}

function reservationRemovedEvent(reservation, eId) {
    return eventContentUtils.basicEvent(reservation.restId, eId || ++eventId, 'reservationRemoved', {
        restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
    });
}

function resetEventId() {
    eventId = 0;
}

module.exports = {
    reservationCreatedEvent,
    reservationConfirmedEvent,
    reservationCancelledEvent,
    restaurantReservationsCreatedEvent,
    reservationAddedEvent,
    reservationRemovedEvent,
    resetEventId,
};
