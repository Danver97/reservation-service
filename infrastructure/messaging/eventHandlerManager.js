const brokers = require('@danver97/event-sourcing/eventBroker');
const handlerFunc = require('./eventHandler');

function exportFunc(manager, brokerName, brokerOptions) {
    const handler = handlerFunc(manager);
    const broker = brokers[brokerName];
    broker.startPoll(handler, brokerOptions);
}

module.exports = exportFunc;
