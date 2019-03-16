const handlerFunc = require('./eventHandler');

function exportFunc(manager, broker) {
    const handler = handlerFunc(manager);

    async function handleAndRemove(e) {
        if (!e)
            return;
        await handler(e);
        await broker.destroyEvent(e);
    }

    function handleMultiEvents(err, events) {
        if (err)
            throw err;
        events.forEach(handleAndRemove);
    }

    return handleMultiEvents;
}

module.exports = exportFunc;
