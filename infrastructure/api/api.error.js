const ExtendableError = require('../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 'paramError',
        name: 'paramError',
    },
    noTokenError: {
        code: 'noTokenError',
        name: 'noTokenError',
    },
    invalidTokenError: {
        code: 'invalidTokenError',
        name: 'invalidTokenError',
    },
    tokenExpiredError: {
        code: 'tokenExpiredError',
        name: 'tokenExpiredError',
    },
    notAuthorizedError: {
        code: 'notAuthorizedError',
        name: 'notAuthorizedError',
    },
};

class ApiError extends ExtendableError {
    
    static get errors() {
        return errorsTypes;
    }

    static paramError(msg) {
        return new ApiError(msg, ApiError.paramErrorCode);
    }

    static noTokenError(msg) {
        return new ApiError(msg, ApiError.noTokenErrorCode);
    }

    static tokenExpiredError(msg) {
        return new ApiError(msg, ApiError.tokenExpiredErrorCode);
    }

    static invalidTokenError(msg) {
        return new ApiError(msg, ApiError.invalidTokenErrorCode);
    }

    static notAuthorizedError(msg) {
        return new ApiError(msg, ApiError.notAuthorizedErrorCode);
    }

    static get paramErrorCode() {
        return errorsTypes.paramError.code;
    }

    static get noTokenErrorCode() {
        return errorsTypes.noTokenError.code;
    }

    static get invalidTokenErrorCode() {
        return errorsTypes.invalidTokenError.code;
    }

    static get tokenExpiredErrorCode() {
        return errorsTypes.tokenExpiredError.code;
    }

    static get notAuthorizedErrorCode() {
        return errorsTypes.notAuthorizedError.code;
    }
}

module.exports = ApiError;
