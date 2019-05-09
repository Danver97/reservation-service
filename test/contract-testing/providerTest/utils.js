const path = require('path');
const { MessageProviderPact } = require('@pact-foundation/pact');
const packageJSON = require('../../../package.json');
const providerVersion = packageJSON.version;
const provider = packageJSON.name;

class Interactor {
    constructor(options) {
        // const pactUrl = options.pactUrl || path.resolve(process.cwd(), 'pacts');
        const opts = {
            messageProviders: options.messageProviders,
            stateHandlers: options.stateHandlers,
            provider,
            providerVersion,
            pactBrokerUrl: '192.168.99.100',
            logLevel: 'warn',
            publishVerificationResult: true,
            tags: ['alpha'],
        };
        this.messageProvider = new MessageProviderPact(opts);
    }

    verify() {
        return this.messageProvider.verify();
    }
}

module.exports = Interactor;
