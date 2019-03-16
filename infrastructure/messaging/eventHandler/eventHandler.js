const RestaurantReservations = require('../../../domain/models/restaurantReservations');
const Reservation = require('../../../domain/models/reservation');

let manager = null;

async function handler(event) {
    if (!event)
        return;
    // console.log(event);
    switch (event.message) {
        case 'restaurantCreated':
            await manager.restaurantReservationsCreated(
                new RestaurantReservations(event.payload.restId, event.payload.timeTable, event.payload.tables),
            );
            break;
        case 'reservationCreated':
            await manager.acceptReservation(event.payload.restId, Reservation.fromObject(event.payload));
            break;
        case 'reservationAdded':
            await manager.reservationConfirmed(event.payload.id, event.payload.table, event.payload.date);
            break;
        case 'reservationCancelled':
            await manager.reservationRemoved(event.payload.restId, event.payload.resId);
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
