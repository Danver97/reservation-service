const path = require('path');
const uuid = require('uuid/v4');
const pact = require('@pact-foundation/pact');
const Event = require('@danver97/event-sourcing/event');
const repo = require('../../infrastructure/repository/repositoryManager')('testdb');
const manager = require('../../domain/logic/restaurantReservationsManager')(repo);
const handler = require('../../infrastructure/messaging/eventHandler/eventHandler')(manager);
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const testUtils = require('../../lib/utils').testUtils;
const eventContent = require('./eventContent');

const {
    MessageConsumerPact,
    asynchronousBodyHandler,
} = pact;
//console.log(pact.Matchers);
const { like, term } = pact.Matchers;
const likeUuid = pact.Matchers.uuid;

const messagePact = new MessageConsumerPact({
    consumer: 'process.MICROSERVICE_NAME',
    dir: path.resolve(process.cwd(), 'pacts'),
    pactfileWriteMode: 'update',
    provider: 'MyJSMessageProvider',
    logLevel: 'warn',
});

const commonMessageHandler = async function(message, assertFunc) {
    const event = Event.fromObject(message);
    const handlerReturn = await handler(event);
    let assertReturn;
    if (assertFunc)
        assertReturn = assertFunc(event, handlerReturn);
    if (assertReturn instanceof Promise)
        await assertReturn;
};

const defineAsyncInteraction = (state, eventName, content, assertFunc) => {
    return (
        messagePact
            .given(state)
            .expectsToReceive(eventName)
            .withContent(content)
            .withMetadata({ 'content-type': 'application/json' })
            .verify(asynchronousBodyHandler(message => commonMessageHandler(message, assertFunc)))
    );
};

describe('Contract Testing', function () {
    this.slow(5000);
    this.timeout(10000);
    const restId = uuid(); // '24071e32-263f-45cc-81b9-f4acac75fb1d';
    const resId = uuid(); // '445f6ab3-8551-4285-bc0e-7e8d61e79827';
    const userId = uuid(); // '70f7d254-e8fa-4671-bb50-e7d181551149';
    const reservationName = 'Smith family'
    const people = 4;
    const rr = new RestaurantReservations(restId, testUtils.timeTable, testUtils.tables);
    let r = new Reservation(userId, restId, reservationName, people, new Date(), '15:00');
    r.id = resId;

    beforeEach(() => repo.reset());

    it('restaurantCreated is handled properly', () => {
        const state = 'a new restaurant is created';
        const eventName = 'restaurantCreated';
        const content = eventContent.restaurantCreatedEvent(restId, 'gino');
        return defineAsyncInteraction(state, eventName, content);
    });

    it('reservationCreated is handled properly', async () => {
        await manager.restaurantReservationsCreated(rr);
        await manager.reservationCreated(r);

        const state = 'a new reservation is created';
        const eventName = 'reservationCreated';
        const content = eventContent.reservationCreatedEvent(r);
        await defineAsyncInteraction(state, eventName, content);
    });

    it('reservationAdded is handled properly', async () => {
        await manager.restaurantReservationsCreated(rr);
        await manager.reservationCreated(r);
        const rAccepted = await manager.acceptReservation(rr.restId, r.id);

        const state = 'a reservation is added to the restaurant reservations';
        const eventName = 'reservationAdded';
        const content = eventContent.reservationAddedEvent(rAccepted);
        await defineAsyncInteraction(state, eventName, content);
    });

    it('reservationCancelled is handled properly', async () => {
        await manager.restaurantReservationsCreated(rr);
        await manager.reservationCreated(r);
        await manager.acceptReservation(rr.restId, r.id);

        const state = 'a reservation has been added to the restaurant reservations but it is now cancelled';
        const eventName = 'reservationCancelled';
        const content = eventContent.reservationCancelledEvent(r);
        await defineAsyncInteraction(state, eventName, content);

        /*await repo.reset();

        await manager.restaurantReservationsCreated(rr);
        await manager.reservationCreated(r);
        await manager.acceptReservation(rr.restId, r.id);

        const state = 'a reservation has not been added to the restaurant reservations but it is now cancelled';
        const eventName = 'reservationCancelled';
        const content = eventContent.reservationCancelledEvent(r);
        await defineAsyncInteraction(state, eventName, content);*/
    });
});
