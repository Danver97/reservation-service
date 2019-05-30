const assert = require('assert');
const Event = require('@danver97/event-sourcing/event');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const MongoClient = require('mongodb').MongoClient;
const orderControl = require('../../../../infrastructure/denormalizers/mongodb/orderControl')('testdb');
const writerFunc = require('../../../../infrastructure/denormalizers/mongodb/writer');
const handlerFunc = require('../../../../infrastructure/denormalizers/mongodb/handler');
// const utils = require('./utils');