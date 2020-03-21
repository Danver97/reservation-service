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

    static get paramErrorCode() {
        return errorsTypes.paramError.code;
    }

    static get notFoundErrorCode() {
        return errorsTypes.notFoundError.code;
    }
}

module.exports = QueryError;
