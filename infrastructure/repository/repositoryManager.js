const dbs = require('@danver97/event-sourcing/eventStore');
const ENV = require('../../src/env');
const repoImpl = require('./repo');

function exportFunc(db) {
    let repo;
    if (!db)
        repo = repoImpl(dbs[ENV.event_store]);
    else
        repo = repoImpl(dbs[db]);
    console.log(`Repo started with: ${db || ENV.event_store}`);
    return repo;
}

module.exports = exportFunc;
