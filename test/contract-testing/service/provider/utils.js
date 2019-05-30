const path = require('path');
const { MessageProviderPact, Matchers } = require('@pact-foundation/pact');
const packageJSON = require('../../../package.json');
const providerVersion = packageJSON.version;
const provider = packageJSON.name;
const pactBroker = require('../../pactBroker.config');

class Interactor {
    constructor(options) {
        // const pactUrl = options.pactUrl || path.resolve(process.cwd(), 'pacts');
        this.opts = {
            messageProviders: options.messageProviders,
            stateHandlers: options.stateHandlers,
            provider,
            providerVersion,
            logLevel: 'warn',
            publishVerificationResult: true,
            tags: ['alpha'],
        };
        if (pactBroker.isAvailable)
            this.opts.pactBrokerUrl = pactBroker.url;
        else {
            this.opts.publishVerificationResult = false;
            this.opts.pactUrls = [path.resolve(
                process.cwd(),
                'pacts',
                'reservation-service-reservation-service.json'
            )];
        }
        this.messageProvider = new MessageProviderPact(this.opts);
    }

    async verify() {
        if (!pactBroker.isAvailable) {
            console.log('\nPact broker not available.');
            console.log('Verification will be done only for self-consumed messages, if relative pact files are present.');
            console.log('Pact publication will be skipped.\n');
        }
        await this.messageProvider.verify();
        if (pactBroker.isAvailable)
            console.log(`\n\nPact verification results published to PactBroker at ${this.opts.pactBrokerUrl}`);
        else
            console.log('\n\nPact verification results not published');
    }
}

module.exports = Interactor;
