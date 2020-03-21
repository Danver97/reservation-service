const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 'paramError',
        name: 'paramError',
    },
    notFoundError: {
        code: 'notFoundError',
        name: 'notFoundError',
    },
    reservationNotFoundError: {
        code: 'reservationNotFoundError',
        name: 'reservationNotFoundError',
    },
    reservationsNotFoundError: {
        code: 'reservationsNotFoundError',
        name: 'reservationsNotFoundError',
    },
    restaurantReservationsNotFoundError: {
        code: 'restaurantReservationsNotFoundError',
        name: 'restaurantReservationsNotFoundError',
    },
};

class QueryError extends ExtendableError {
    /* constructor(message, errorCode) {
        let code = errorCode;
        if (typeof code === 'object')
            code = code.code;
        super(message, code);
    } */

    static get errors() {
        return errorsTypes;
    }

    static paramError(msg) {
        return new QueryError(msg, QueryError.paramErrorCode);
    }

    static notFoundError(msg) {
        return new QueryError(msg, QueryError.notFoundErrorCode);
    }

    static reservationNotFoundError(msg) {
        return new QueryError(msg, QueryError.reservationNotFoundErrorCode);
    }

    static reservationsNotFoundError(msg) {
        return new QueryError(msg, QueryError.reservationsNotFoundErrorCode);
    }

    static restaurantReservationsNotFoundError(msg) {
        return new QueryError(msg, QueryError.restaurantReservationsNotFoundErrorCode);
    }

    static get paramErrorCode() {
        return errorsTypes.paramError.code;
    }

    static get notFoundErrorCode() {
        return errorsTypes.notFoundError.code;
    }

    static get reservationNotFoundErrorCode() {
        return errorsTypes.reservationNotFoundError.code;
    }

    static get reservationsNotFoundErrorCode() {
        return errorsTypes.reservationsNotFoundError.code;
    }

    static get restaurantReservationsNotFoundErrorCode() {
        return errorsTypes.restaurantReservationsNotFoundError.code;
    }
}

module.exports = QueryError;
