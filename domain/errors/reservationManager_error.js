const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 0,
        name: 'paramError',
    },
    restaurantDoesNotExist: {
        code: 100,
        name: 'restaurantDoesNotExist',
    },
};

class ReservationManagerError extends ExtendableError {
    /* constructor(message, errorCode) {
        let code = errorCode;
        if (typeof code === 'object')
            code = code.code;
        super(message, code);
    } */

    static get errors() {
        return errorsTypes;
    }

    static get paramError() {
        return errorsTypes.paramError.code;
    }

    static get restaurantDoesNotExist() {
        return errorsTypes.restaurantDoesNotExist.code;
    }
}

module.exports = ReservationManagerError;
