const uuid = require('uuid/v4');
const getTables = require('../../../test-utils').getTables;

const defaultRestId = '52db11c3-ffed-489e-984b-ef2972f56d8f';
const defaultUserId = 'c398ffa9-4cdd-4068-b3af-519b3b2e95b7';

const tipicalDay = {
    morning: {
        open: '10:00',
        close: '14:00',
    },
    afternoon: {
        open: '18:00',
        close: '23:00',
    }
};

const timeTable = {
    Monday: 'closed',
    Tuesday: 'closed',
    Wednesday: tipicalDay,
    Thursday: tipicalDay,
    Friday: tipicalDay,
    Saturday: tipicalDay,
    Sunday: tipicalDay,
};

function tables(restId) {
    return getTables(defaultRestId || restId).map(t => {
        const newT = JSON.parse(t.toString());
        delete newT.reservations;
        return newT;
    });
}

function restaurantReservations(streamId) {
    return {
        _id: defaultRestId || streamId,
        restId: defaultRestId || streamId,
        timeTable: timeTable,
        tables: tables(streamId),
        reservations: [],
        _revisionId: 1,
    };
}

function reservation(restId, userId) {
    const resId = uuid();
    return {
        _id: resId,
        resId,
        restId: restId || defaultRestId,
        status: 'pending',
        statusCode: 0,
        userId: userId || defaultUserId,
        reservationName: 'Lucio',
        people: 4,
        date: new Date(),
        _revisionId: 1,
    };
}

function reservationToAdd(restId) {
    return {
        resId: uuid(),
        restId: restId || defaultRestId,
        table: tables(restId)[0],
        date: new Date(),
    }
}

module.exports = {
    timeTable,
    restaurantReservations,
    reservation,
    reservationToAdd,
};
