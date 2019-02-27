const brokers = require('@danver97/event-sourcing/eventBroker');
const handlerFunc = require('./eventHandler');

function exportFunc(manager, brokerName, options) {
    const handler = handlerFunc(manager);
    const broker = brokers[brokerName];
    broker.startPoll(handler, options);
}

module.exports = exportFunc;
