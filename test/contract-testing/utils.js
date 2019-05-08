const path = require('path');
const pact = require('@pact-foundation/pact');
const Event = require('@danver97/event-sourcing/event');
const repo = require('../../infrastructure/repository/repositoryManager')('testdb');
const manager = require('../../domain/logic/restaurantReservationsManager')(repo);
const handler = require('../../infrastructure/messaging/eventHandler/eventHandler')(manager);

const {
    MessageConsumerPact,
    asynchronousBodyHandler,
} = pact;

let messagePact;

async function commonMessageHandler (message, assertFunc) {
    const event = Event.fromObject(message);
    const handlerReturn = await handler(event);
    let assertReturn;
    if (assertFunc)
        assertReturn = assertFunc(event, handlerReturn);
    if (assertReturn instanceof Promise)
        await assertReturn;
};

function defineAsyncInteraction (state, eventName, content, assertFunc) {
    return (
        messagePact
            .given(state)
            .expectsToReceive(eventName)
            .withContent(content)
            .withMetadata({ 'content-type': 'application/json' })
            .verify(asynchronousBodyHandler(message => commonMessageHandler(message, assertFunc)))
    );
};

function exportFunc(options) {
    if (!options.consumer || !options.provider)
        throw new Error(`Missing parameters in options:
        ${!options.consumer ? 'options.consumer' : ''}
        ${!options.provider ? 'options.provider' : ''}`);
    const opts = {
        consumer: options.consumer,
        dir: options.dir || path.resolve(process.cwd(), 'pacts'),
        pactfileWriteMode: options.pactfileWriteMode || 'update',
        provider: options.provider,
        logLevel: options.logLevel || 'warn',
    };
    messagePact = new MessageConsumerPact(opts);
    return defineAsyncInteraction;
}

module.exports = exportFunc;
