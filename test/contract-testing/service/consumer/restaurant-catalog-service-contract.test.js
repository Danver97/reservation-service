const assert = require('assert');
const repo = require('../../../../infrastructure/repository/repositoryManager')('testdb');
const manager = require('../../../../domain/logic/restaurantReservationsManager')(repo);
const handler = require('../../../../infrastructure/messaging/eventHandler/eventHandler')(manager);
const RestaurantReservations = require('../../../../domain/models/restaurantReservations');
const testUtils = require('../../../test-utils');
const eventContent = require('./lib/eventContent');
const Interactor = require('../../contract-testing-utils').Interactor;

const interactor = new Interactor({
    consumer: 'reservation-service',  // TODO: parametrize
    provider: 'restaurant-catalog-service',
}, handler);

describe('Restaurant Catalog Service Contract Testing', function () {
    this.slow(5000);
    this.timeout(10000);
    const restId = '24071e32-263f-45cc-81b9-f4acac75fb1d';
    const rr = new RestaurantReservations(restId, testUtils.timeTable, testUtils.tables);

    beforeEach(() => repo.reset());

    it('restaurantCreated is handled properly', () => {
        const state = 'a new restaurant is created';
        const eventName = 'restaurantCreated';
        const content = eventContent.restaurantCreatedEvent(restId, 'gino');
        return interactor.defineAsyncInteraction(state, eventName, content, () => {
            assert.doesNotThrow(async () => await repo.getReservations(rr.restId), Error);
        });
    });

    after(() => interactor.publishPacts());
});