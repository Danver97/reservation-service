const repoFunc = require('../infrastructure/repository/repo');
const managerFunc = require('../domain/logic/restaurantReservationsManager');
const queryMgrFunc = require('../infrastructure/query');
const brokerHandlerFunc = require('../infrastructure/messaging/eventHandler/brokerHandler');
const appFunc = require('../src/app');

async function exportFunc(eventStore, broker, projections, brokerOptions = {}) {
    const eventBroker = new broker.EbHandler('Reservation');
    await eventBroker.subscribe('microservice-test');

    const mongodbConfig = projections.mongodb;

    const repo = repoFunc(eventStore);
    const manager = managerFunc(repo);
    const queryMgr = await queryMgrFunc(mongodbConfig.dbUrl, mongodbConfig.dbName, mongodbConfig.collectionName);
    const app = appFunc(manager, queryMgr);
    const brokerHandler = brokerHandlerFunc(manager, eventBroker);

    const brokerPollOptions = brokerOptions.brokerPollOptions || {};
    eventBroker.startPoll(brokerPollOptions, (err, evs) => {
        if (brokerOptions.loggingCb)
            brokerOptions.loggingCb(err, evs);
        brokerHandler(err, evs);
    }, brokerPollOptions.ms);

    return {
        eventBroker,
        repo,
        manager,
        queryMgr,
        app,
    };
}

module.exports = exportFunc;
