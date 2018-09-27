const ENV = require('../../src/env');
const testdb = require('../db/testdb');

const eventStores = {
    testdb,
};

const store = eventStores[ENV.event_store];

module.exports = function (broker) {
    if (broker) {
        broker.pickOnNotification(event => {
            store.persist(event);
            store.emit(`${event.topic}:${event.message}`, event);
        });
    }
    return store;
};
