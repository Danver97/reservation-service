const MongoClient = require('mongodb').MongoClient;
const QueryError = require('./query_error');
const repoFunc = require('./repo');

let mongo;

async function exportFunc(mongoConnString, dbName, collectionName) {
    if (!mongoConnString)
        throw QueryError.paramError(`Missing the following parameters:${mongoConnString ? '' : ' mongoConnString'}`);
    mongo = new MongoClient(mongoConnString, { useNewUrlParser: true });
    await mongo.connect();
    return repoFunc(mongo.db(dbName).collection(collectionName));
}

module.exports = exportFunc;
