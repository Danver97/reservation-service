const ExtendableError = require('../../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 0,
        name: 'paramError',
    },
    eventStreamDoesNotExist: {
        code: 100,
        name: 'eventStreamDoesNotExist',
    },
};

class RepositoryError extends ExtendableError {
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

    static get eventStreamDoesNotExist() {
        return errorsTypes.eventStreamDoesNotExist.code;
    }
}

module.exports = RepositoryError;
