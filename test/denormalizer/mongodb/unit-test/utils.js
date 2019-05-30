const uuid = require('uuid/v4');

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

function restaurantReservations(streamId) {
    return {
        _id: defaultRestId || streamId,
        restId: defaultRestId || streamId,
        timeTable: timeTable,
        tables: [],
        _revisionId: 1,
    };
}

function reservation(restId, userId) {
    return {
        id: uuid(),
        restId: restId || defaultRestId,
        status: 'pending',
        statusCode: 0,
        userId: userId || defaultUserId,
        reservationName: 'Lucio',
        people: 4,
        date: new Date(),
    };
}

module.exports = {
    timeTable,
    restaurantReservations,
    reservation,
};
