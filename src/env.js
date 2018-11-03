const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production')
    dotenv.load();

const ENV = {
    test: false,
    dburl: '',
    port: 3000,
    node_env: 'test',
    event_broker: 'testdb',
    event_store: 'testdb',
};

ENV.node_env = process.env.NODE_ENV || 'test';
ENV.port = process.env.PORT || 3000;
ENV.infrastructure = process.env.INFRASTRUCTURE;

ENV.event_broker = process.env.EVENT_BROKER || 'testdb';
ENV.event_store = process.env.EVENT_STORE || 'testdb';

ENV.test = process.env.TEST || 'true';
ENV.dburl = process.env.DB_URL;
ENV.dbname = process.env.DB_NAME || 'testdb';

module.exports = ENV;
