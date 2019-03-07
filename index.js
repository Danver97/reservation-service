const ENV = require('./src/env');
const repo = require('./infrastructure/repository/repositoryManager')();
const businessManager = require('./domain/logic/restaurantReservationsManager')(repo);
const eventHandlerManager = require('./infrastructure/messaging/eventHandlerManager')(businessManager, ENV.event_broker, {});
const app = require('./src/app')(businessManager); // require('./infrastructure/api');

app.listen(ENV.port, () => {
    console.log('Server started on port ' + ENV.port);
});
