const brokers = require('@danver97/event-sourcing/eventBroker');
const handlerFunc = require('./eventHandler');

let pollId = null;

function exportFunc(manager, brokerName, brokerOptions = {}) {
    const handler = handlerFunc(manager);
    const broker = brokers[brokerName];

    async function handleAndRemove(e) {
        if (e) {
            await handler(e);
            await broker.destroyEvent(e);
        }
    }

    function handleMultiEvents(err, events) {
        if (err)
            throw err;
        events.forEach(handleAndRemove);
    }

    function stopHandler() {
        broker.stopPoll(pollId);
    }

    pollId = broker.startPoll(brokerOptions, handleMultiEvents, brokerOptions.ms);
    return stopHandler;
}

module.exports = exportFunc;
