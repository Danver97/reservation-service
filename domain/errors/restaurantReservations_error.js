const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 'paramError',
        name: 'paramError',
    },
    reservationAlreadyAddedError: {
        code: 'reservationAlreadyAddedError',
        name: 'reservationAlreadyAddedError',
    },
    reservationStatusError: {
        code: 'reservationStatusError',
        name: 'reservationStatusError',
    },
    reservationNotFoundError: {
        code: 'reservationNotFoundError',
        name: 'reservationNotFoundError',
    },
    reservationNotAcceptableError: {
        code: 'reservationNotAcceptableError',
        name: 'reservationNotAcceptableError',
    },
    resTooBigForAutoAcceptError: {
        code: 'resTooBigForAutoAcceptError',
        name: 'resTooBigForAutoAcceptError',
    },
};

class RestaurantReservationError extends ExtendableError {
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
        return new RestaurantReservationError(msg, RestaurantReservationError.paramErrorCode);
    }

    static reservationAlreadyAddedError(msg) {
        return new RestaurantReservationError(msg, RestaurantReservationError.reservationAlreadyAddedErrorCode);
    }

    static reservationStatusError(msg) {
        return new RestaurantReservationError(msg, RestaurantReservationError.reservationStatusErrorCode);
    }

    static reservationNotFoundError(msg) {
        return new RestaurantReservationError(msg, RestaurantReservationError.reservationNotFoundErrorCode);
    }

    static reservationNotAcceptableError(msg) {
        return new RestaurantReservationError(msg, RestaurantReservationError.reservationNotAcceptableErrorCode);
    }

    static resTooBigForAutoAcceptError(msg) {
        return new RestaurantReservationError(msg, RestaurantReservationError.resTooBigForAutoAcceptErrorCode);
    }

    static get paramErrorCode() {
        return errorsTypes.paramError.code;
    }

    static get reservationAlreadyAddedErrorCode() {
        return errorsTypes.reservationAlreadyAddedError.code;
    }

    static get reservationStatusErrorCode() {
        return errorsTypes.reservationStatusError.code;
    }

    static get reservationNotFoundErrorCode() {
        return errorsTypes.reservationNotFoundError.code;
    }

    static get reservationNotAcceptableErrorCode() {
        return errorsTypes.reservationNotAcceptableError.code;
    }

    static get resTooBigForAutoAcceptErrorCode() {
        return errorsTypes.resTooBigForAutoAcceptError.code;
    }
}

module.exports = RestaurantReservationError;
