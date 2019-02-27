const RestaurantReservations = require('../../domain/models/restaurantReservations');

let manager = null;

async function handler(event) {
    switch (event.message) {
        case 'restaurantCreated':
            await manager.restaurantReservationsCreated(
                new RestaurantReservations(event.payload.restId, event.payload.timeTable, event.payload.tables),
            );
            break;
        default:
    }
}

function exportFunc(restaurantReservationsManager) {
    if (!restaurantReservationsManager)
        throw new Error('manager parameter required.');
    manager = restaurantReservationsManager;
    return handler;
}

module.exports = exportFunc;
