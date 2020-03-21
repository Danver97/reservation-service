const apiutils = require('./utils');

const ApiError = require('./api.error');
const ReservationManagerError = require('../../domain/errors/reservationManager_error');
const QueryError = require('../query/query_error');
const RepositoryError = require('../repository/errors/RepositoryError');

function errorHandler(err, req, res, next) {
    if (err instanceof ApiError) {
        switch (err.code) {
            case ApiError.paramErrorCode:
                apiutils.clientError(res, err.code, 400);
                return;
            case ApiError.noTokenErrorCode:
                apiutils.clientError(res, 'Access token required', 401);
                return;
            case ApiError.invalidTokenErrorCode:
                apiutils.clientError(res, 'Invalid access token', 401);
                return;
            case ApiError.tokenExpiredErrorCode:
                apiutils.clientError(res, 'Access token expired', 401);
                return;
            case ApiError.notAuthorizedErrorCode:
                apiutils.clientError(res, 'Not authorized', 403);
                return;
        }
    }

    if (err instanceof ReservationManagerError) {
        switch (err.code) {
            case ReservationManagerError.restaurantDoesNotExistErrorCode:
                apiutils.clientError(res, 'Restaurant does not exist', 404);
                return;
        }
    }

    if (err instanceof RepositoryError) {
        switch (err.code) {
            case RepositoryError.eventStreamDoesNotExistErrorCode:
                apiutils.clientError(res, 'Not found', 404);
                return;
        }
    }

    if (err instanceof QueryError) {
        switch (err.code) {
            case QueryError.reservationNotFoundErrorCode:
                apiutils.clientError(res, 'Reservation not found', 404);
                return;
            case QueryError.reservationsNotFoundErrorCode:
                apiutils.clientError(res, 'Reservations not found', 404);
                return;
            case QueryError.restaurantReservationsNotFoundErrorCode:
                apiutils.clientError(res, 'RestaurantReservations not found', 404);
                return;
            case QueryError.notFoundErrorCode:
                apiutils.clientError(res, 'Not found', 404);
                return;
        }
    }
    
    apiutils.serverError(res, err.message);
    return;
}

module.exports = errorHandler;
