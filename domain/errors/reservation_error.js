const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 0,
        name: 'paramError',
    },
    statusChangeError: {
        code: 100,
        name: 'statusChangeError',
    },
    tooSmallTableError: {
        code: 101,
        name: 'tooSmallTableError',
    },
};

class ReservationError extends ExtendableError {
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

    static get statusChangeError() {
        return errorsTypes.statusChangeError.code;
    }

    static get tooSmallTableError() {
        return errorsTypes.tooSmallTableError.code;
    }
}

module.exports = ReservationError;
