function mins(qty) {
    return qty * 60 * 1000;
}

function hours(qty) {
    return mins(qty * 60);
}

function promisify(execute, cb) {
    const promise = new Promise(async (resolve, reject) => {
        let err = null;
        let result;
        try {
            result = execute();
            if (result instanceof Promise)
                result = await result;
        } catch (e) {
            err = e;
        }
        if (cb)
            cb(err, result);
        if (!cb && err)
            reject(err);
        else
            resolve(result);
    });
    if (cb)
        return null;
    return promise;
}

module.exports = {
    mins,
    hours,
    promisify,
};
