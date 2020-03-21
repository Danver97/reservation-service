const dbs = require('@danver97/event-sourcing/eventStore');
const ENV = require('../../src/env');
const repoImpl = require('./repo');

function exportFunc(db, options = { eventStoreName: 'prova' }) {
    let repo;
    if (!db)
        repo = repoImpl(new dbs[ENV.event_store](options));
    else
        repo = repoImpl(new dbs[db](options));
    console.log(`Repo started with: ${db || ENV.event_store}`);
    return repo;
}

module.exports = exportFunc;
