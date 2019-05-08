const repo = require('../../infrastructure/repository/repositoryManager')('testdb');
const manager = require('../../domain/logic/restaurantReservationsManager')(repo);
const Reservation = require('../../domain/models/reservation');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const testUtils = require('../test-utils');
const eventContent = require('./eventContent');
const MessageConsumerPact = require('./utils');
const consumerVersion = require('../../package.json').version;

const defineAsyncInteraction = MessageConsumerPact({
    consumer: 'reservation-service',  // TODO: parametrize
    provider: 'reservation-service',
});

describe('Reservation Service Contract Testing', function () {
    this.slow(5000);
    this.timeout(10000);
    const restId = '24071e32-263f-45cc-81b9-f4acac75fb1d';
    const resId = '445f6ab3-8551-4285-bc0e-7e8d61e79827';
    const userId = '70f7d254-e8fa-4671-bb50-e7d181551149';
    const reservationName = 'Smith family'
    const people = 4;
    const rr = new RestaurantReservations(restId, testUtils.timeTable, testUtils.tables);

    const date = new Date('2040/08/15'); // iso8601DateTimeWithMillis
    let r = new Reservation(userId, restId, reservationName, people, date, '15:00');
    r.id = resId;

    beforeEach(() => repo.reset());

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

        /* should pass even reservation has not been approved? */
    });
});
