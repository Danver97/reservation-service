const ENV = require('./src/env');
const repo = require('./infrastructure/repository/repositoryManager')(ENV.event_store);
const businessManager = require('./domain/logic/restaurantReservationsManager')(repo);
const eventHandlerManager = require('./infrastructure/messaging/eventHandler')(businessManager, ENV.event_broker, {});
const queryManager = require('./infrastructure/query')(ENV.mongodb_url, ENV.mongodb_dbName, ENV.mongodb_collection);
const app = require('./src/app')(businessManager, queryManager); // require('./infrastructure/api');

app.listen(ENV.port, () => {
    console.log(`Server started on port ${ENV.port}`);
});
