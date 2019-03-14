const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 0,
        name: 'paramError',
    },
    notFound: {
        code: 100,
        name: 'notFound',
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

    static get paramError() {
        return errorsTypes.paramError.code;
    }

    static get notFound() {
        return errorsTypes.notFound.code;
    }
}

module.exports = QueryError;
