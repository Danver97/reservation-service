const assert = require('assert');
const Promisify = require('promisify-cb');
const Table = require('../domain/models/table');

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

function mins(qty) {
    return qty * 60 * 1000;
}

function hours(qty) {
    return mins(qty * 60);
}

function optimisticLocking(execute, cb) {
    return Promisify(async () => {
        let err = false;
        let result = null;
        const error = () => { err = true; };
        do {
            err = false;
            result = execute(error);
            if (result instanceof Promise)
                result = await result;
        } while (err);
        return result;
    }, cb);
}

function defineArrayFlat() {
    if (Array.prototype.flat)
        return;
    Object.defineProperty(Array.prototype, 'flat', {
        value(depth = 1) {
            return this.reduce(function (flat, toFlatten) {
                return flat.concat((Array.isArray(toFlatten) && (depth-1)) ? toFlatten.flat(depth-1) : toFlatten);
            }, []);
        },
    });
}

function defineArrayFlatMap() {
    if (Array.prototype.flatMap)
        return;
    Object.defineProperty(Array.prototype, 'flatMap', {
        value(mapFunc) {
            return this.reduce((flat, toFlatten) => flat.concat(mapFunc(toFlatten)), []);
        },
    });
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

const testUtils = {
    timeTable,
    tables,
    assertStrictEqual,
};

module.exports = {
    assertStrictEqual,
    testUtils,
    mins,
    hours,
    optimisticLocking,
    defineArrayFlat,
    defineArrayFlatMap,
};
