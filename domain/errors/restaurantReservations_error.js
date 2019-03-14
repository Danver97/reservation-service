const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 0,
        name: 'paramError',
    },
    reservationAlreadyAddedError: {
        code: 100,
        name: 'reservationAlreadyAddedError',
    },
    reservationStatusError: {
        code: 101,
        name: 'reservationStatusError',
    },
    reservationNotFoundError: {
        code: 102,
        name: 'reservationNotFoundError',
    },
};

class RestaurantReservationError extends ExtendableError {
    constructor(message, errorCode) {
        let code = errorCode;
        if (typeof code === 'object')
            code = code.code;
        super(message, code);
    }

    static get errors() {
        return errorsTypes;
    }

    static get paramError() {
        return errorsTypes.paramError.code;
    }

    static get reservationAlreadyAddedError() {
        return errorsTypes.reservationAlreadyAddedError.code;
    }

    static get reservationStatusError() {
        return errorsTypes.reservationStatusError.code;
    }

    static get reservationNotFoundError() {
        return errorsTypes.reservationNotFoundError.code;
    }
}

module.exports = RestaurantReservationError;
