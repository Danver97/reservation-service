const pact = require('@pact-foundation/pact');
const eventContentUtils = require('../../../contract-testing-utils').eventContentUtils;
const timeTable = require('../../../../test-utils').timeTable;

const { like, term, iso8601DateTimeWithMillis } = pact.Matchers;
const likeUuid = pact.Matchers.uuid;
/*
const hourRegExp = '^(([0-1][0-9]:[0-5][0-9])|(2[0-3]:[0-5][0-9]))$';
const dayTimeTable = {
    morning: {
        open: term({ generate: '11:00', matcher: hourRegExp }),
        close: term({ generate: '14:00', matcher: hourRegExp })
    },
    afternoon: {
        open: term({ generate: '18:00', matcher: hourRegExp }),
        close: term({ generate: '23:00', matcher: hourRegExp })
    },
};
const timeTable = {
    Monday: dayTimeTable,
    Tuesday: dayTimeTable,
    Wednesday: dayTimeTable,
    Thursday: dayTimeTable,
    Friday: dayTimeTable,
    Saturday: dayTimeTable,
    Sunday: dayTimeTable,
};

const likeTable = (id, people, restId) => {
    const table = {
        id: like(id),
        people: like(people),
    };
    if (restId)
    table.restId = likeUuid(restId);
    return table;
}
const likeTables = restId => [
    likeTable('1', 2, restId),
    likeTable('2', 3, restId),
    likeTable('3', 4, restId),
    likeTable('4', 4, restId),
    likeTable('5', 4, restId),
    likeTable('6', 6, restId),
];

function basicEvent(streamId, eventId, message, payload){
    return {
        streamId: likeUuid(streamId),
        eventId: like(eventId),
        message,
        payload,
    };
}*/

function restaurantCreatedEvent(restId, owner) {
    return eventContentUtils.basicEvent(restId, 1, 'restaurantCreated', {
        restId: likeUuid(restId),
        owner: like(owner),
        tables: eventContentUtils.matchers.likeTables(restId),
        timeTable,
    });
}

function reservationCreatedEvent(reservation) {
    return eventContentUtils.basicEvent(reservation.id, 1, 'reservationCreated', {
        restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
        /* userId: likeUuid(userId),
        reservationName: like(reservationName),
        people: like(people),
        date, */
    });
}

function reservationAddedEvent(reservation) {
    const r = reservation
    return eventContentUtils.basicEvent(reservation.restId, 1, 'reservationAdded', {
        // restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
        table: eventContentUtils.matchers.likeTable(r.table.id, r.table.people),
        date: iso8601DateTimeWithMillis(reservation.date.toJSON()),
    });
}

function reservationCancelledEvent(reservation) {
    return eventContentUtils.basicEvent(reservation.id, 1, 'reservationCancelled', {
        restId: likeUuid(reservation.restId),
        resId: likeUuid(reservation.id),
    });
}

module.exports = {
    restaurantCreatedEvent,
    reservationCreatedEvent,
    reservationAddedEvent,
    reservationCancelledEvent,
};
