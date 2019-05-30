const pact = require('@pact-foundation/pact');

const { like, term } = pact.Matchers;
const likeUuid = pact.Matchers.uuid;

function likeTimeTable() {
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
    return timeTable;
}

function likeTable(id, people, restId) {
    const table = {
        id: like(id),
        people: like(people),
    };
    if (restId)
    table.restId = likeUuid(restId);
    return table;
}
function likeTables(restId) {
    return [
        likeTable('1', 2, restId),
        likeTable('2', 3, restId),
        likeTable('3', 4, restId),
        likeTable('4', 4, restId),
        likeTable('5', 4, restId),
        likeTable('6', 6, restId),
    ];
}

function basicEvent(streamId, eventId, message, payload){
    return {
        streamId: likeUuid(streamId),
        eventId: like(eventId),
        message,
        payload,
    };
}

module.exports = {
    matchers: {
        likeTimeTable,
        likeTable,
        likeTables,
    },
    basicEvent,
}
