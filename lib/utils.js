const assert = require('assert');
const Promisify = require('promisify-cb');

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
            result = execute(error);
            if (result instanceof Promise)
                result = await result;
        } while (!err);
        return result;
    }, cb);
}

module.exports = {
    assertStrictEqual,
    mins,
    hours,
    optimisticLocking,
};
