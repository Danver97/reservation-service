const ExtendableError = require('../../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 0,
        name: 'paramError',
    },
};

class RepositoryError extends ExtendableError {
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
}

module.exports = RepositoryError;
