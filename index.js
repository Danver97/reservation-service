const repo = require('./infrastructure/repository/repositoryManager')('reponame');
const businessManager = require('./domain/logic/restaurantReservationsManager')(repo);
const eventHandlerManager = require('./infrastructure/messaging/eventHandlerManager')(businessManager, 'brokername', {});
const app = require('./src/app')(businessManager); // require('./infrastructure/api');
const ENV = require('./src/env');

app.listen(ENV.port, () => {
    console.log('Server started on port ' + ENV.port);
});
