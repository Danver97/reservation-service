const path = require('path');
const { MessageProviderPact, Matchers } = require('@pact-foundation/pact');
const packageJSON = require('../../../package.json');
const providerVersion = packageJSON.version;
const provider = packageJSON.name;

class Interactor {
    constructor(options) {
        // const pactUrl = options.pactUrl || path.resolve(process.cwd(), 'pacts');
        this.opts = {
            messageProviders: options.messageProviders,
            stateHandlers: options.stateHandlers,
            provider,
            providerVersion,
            pactBrokerUrl: 'http://192.168.99.100',
            logLevel: 'warn',
            publishVerificationResult: true,
            tags: ['alpha'],
        };
        this.messageProvider = new MessageProviderPact(this.opts);
    }

    async verify() {
        await this.messageProvider.verify();
        console.log(`\n\nPact verification results published to PactBroker at ${this.opts.pactBrokerUrl}`);
    }
}

module.exports = Interactor;
