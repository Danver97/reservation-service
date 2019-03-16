const brokers = require('@danver97/event-sourcing/eventBroker');
const brokerHandlerFunc = require('./brokerHandler');

let pollId = null;

function exportFunc(manager, brokerName, brokerOptions = {}) {
    const broker = brokers[brokerName];
    const brokerHandler = brokerHandlerFunc(manager, broker);

    function stopHandler() {
        broker.stopPoll(pollId);
    }

    pollId = broker.startPoll(brokerOptions, brokerHandler, brokerOptions.ms);
    console.log(`Broker polling started with: ${brokerName}`);
    return stopHandler;
}

module.exports = exportFunc;
