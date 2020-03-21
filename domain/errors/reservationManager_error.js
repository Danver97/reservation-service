const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 'paramError',
        name: 'paramError',
    },
    restaurantDoesNotExistError: {
        code: 'restaurantDoesNotExistError',
        name: 'restaurantDoesNotExistError',
    },
};

class ReservationManagerError extends ExtendableError {

    static get errors() {
        return errorsTypes;
    }

    static paramError(msg) {
        return new ReservationManagerError(msg, ReservationManagerError.paramErrorCode);
    }

    static restaurantDoesNotExistError(msg) {
        return new ReservationManagerError(msg, ReservationManagerError.restaurantDoesNotExistErrorCode);
    }

    static get paramErrorCode() {
        return errorsTypes.paramError.code;
    }

    static get restaurantDoesNotExistErrorCode() {
        return errorsTypes.restaurantDoesNotExistError.code;
    }
}

module.exports = ReservationManagerError;
