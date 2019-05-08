const uuid = require('uuid/v4');
const repo = require('../../infrastructure/repository/repositoryManager')('testdb');
const RestaurantReservations = require('../../domain/models/restaurantReservations');
const testUtils = require('../test-utils');
const eventContent = require('./eventContent');
const MessageConsumerPact = require('./utils');
const consumerVersion = require('../../package.json').version;

const defineAsyncInteraction = MessageConsumerPact({
    consumer: 'reservation-service',  // TODO: parametrize
    provider: 'restaurant-service',
});

describe('Restaurant Service Contract Testing', function () {
    this.slow(5000);
    this.timeout(10000);
    const restId = uuid(); // '24071e32-263f-45cc-81b9-f4acac75fb1d';
    const rr = new RestaurantReservations(restId, testUtils.timeTable, testUtils.tables);

    beforeEach(() => repo.reset());

    it('restaurantCreated is handled properly', () => {
        const state = 'a new restaurant is created';
        const eventName = 'restaurantCreated';
        const content = eventContent.restaurantCreatedEvent(restId, 'gino');
        return defineAsyncInteraction(state, eventName, content);
    });
});
