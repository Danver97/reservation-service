const MongoClient = require('mongodb').MongoClient;
const QueryError = require('./query_error');
const repoFunc = require('./repo');

let mongo;

async function exportFunc(mongoConnString, dbName, collectionName) {
    if (!mongoConnString)
        throw new QueryError(`Missing the following parameters:${mongoConnString ? '' : ' mongoConnString'}`, QueryError.paramError);
    mongo = new MongoClient(mongoConnString, { useNewUrlParser: true });
    await mongo.connect();
    return repoFunc(mongo.db(dbName).collection(collectionName));
}

module.exports = exportFunc;
