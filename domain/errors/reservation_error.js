const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 'paramError',
        name: 'paramError',
    },
    statusChangeError: {
        code: 'statusChangeError',
        name: 'statusChangeError',
    },
    tooSmallTableError: {
        code: 'tooSmallTableError',
        name: 'tooSmallTableError',
    },
};

class ReservationError extends ExtendableError {

    static get errors() {
        return errorsTypes;
    }

    static paramError(msg) {
        return new ReservationError(msg, ReservationError.paramErrorCode);
    }

    static statusChangeError(msg) {
        return new ReservationError(msg, ReservationError.statusChangeErrorCode);
    }

    static tooSmallTableError(msg) {
        return new ReservationError(msg, ReservationError.tooSmallTableErrorCode);
    }

    static get paramErrorCode() {
        return errorsTypes.paramError.code;
    }

    static get statusChangeErrorCode() {
        return errorsTypes.statusChangeError.code;
    }

    static get tooSmallTableErrorCode() {
        return errorsTypes.tooSmallTableError.code;
    }
}

module.exports = ReservationError;
