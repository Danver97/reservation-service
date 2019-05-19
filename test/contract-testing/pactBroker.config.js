let isAvailable;
if (process.env.PACT_BROKER_AVAILABLE === 'true')
    isAvailable = true;
else
    isAvailable = false;


const broker = {
    url: process.env.PACT_BROKER_URL || 'http://192.168.99.100',
    isAvailable,
};

module.exports = broker;
