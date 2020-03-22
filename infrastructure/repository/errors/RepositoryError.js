const ExtendableError = require('../../../lib/extendable_error');

const errorsTypes = {
    paramError: {
        code: 'paramError',
        name: 'paramError',
    },
    eventStreamDoesNotExistError: {
        code: 'eventStreamDoesNotExistError',
        name: 'eventStreamDoesNotExistError',
    },
    optimisticLockError: {
        code: 'optimisticLockError',
        name: 'optimisticLockError',
    },
};

class RepositoryError extends ExtendableError {

    static get errors() {
        return errorsTypes;
    }

    static paramError(msg) {
        return new RepositoryError(msg, RepositoryError.paramErrorCode);
    }

    static eventStreamDoesNotExistError(msg) {
        return new RepositoryError(msg, RepositoryError.eventStreamDoesNotExistErrorCode);
    }

    static optimisticLockError(msg) {
        return new RepositoryError(msg, RepositoryError.optimisticLockErrorCode);
    }

    static get paramErrorCode() {
        return errorsTypes.paramError.code;
    }

    static get eventStreamDoesNotExistErrorCode() {
        return errorsTypes.eventStreamDoesNotExistError.code;
    }

    static get optimisticLockErrorCode() {
        return errorsTypes.optimisticLockError.code;
    }
}

module.exports = RepositoryError;
