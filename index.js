const app = require('./src/app'); // require('./infrastructure/api');
const repo = require('./infrastructure/repository/repositoryManager')('reponame');
const businessManager = require('./domain/logic/manager')(repo);
const eventHandlerManager = require('./infrastructure/messaging/eventHandlerManager')(businessManager, 'brokername', {});
const ENV = require('./src/env');

app.listen(ENV.port, () => {
    console.log('Server started on port ' + ENV.port);
});
