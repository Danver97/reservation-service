const Table = require('../../domain/models/table');

function assertStrictEqual(actual, expected) {
    const current = Object.assign({}, actual);
    const expect = Object.assign({}, expected);
    Object.keys(current).forEach(k => {
        if (/_.*/.test(k))
            delete current[k];
    });
    Object.keys(expect).forEach(k => {
        if (/_.*/.test(k))
            delete expect[k];
    });
    assert.strictEqual(JSON.stringify(current), JSON.stringify(expect));
}


const dayTimeTable = {
    morning: {
        open: '11:00',
        close: '14:00',
    },
    afternoon: {
        open: '18:00',
        close: '23:00',
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
const tables = [
    new Table('1', 1, 2),
    new Table('2', 1, 3),
    new Table('3', 1, 4),
    new Table('4', 1, 4),
    new Table('5', 1, 4),
    new Table('6', 1, 6),
];

function getTables(restId) {
    return [
        new Table('1', restId, 2),
        new Table('2', restId, 3),
        new Table('3', restId, 4),
        new Table('4', restId, 4),
        new Table('5', restId, 4),
        new Table('6', restId, 6),
    ];
}

const testUtils = {
    timeTable,
    tables,
    getTables,
    assertStrictEqual,
};

module.exports = testUtils;