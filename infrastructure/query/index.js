const MongoClient = require('mongodb').MongoClient;
const repoFunc = require('./repo');

let mongo;

async function exportFunc(mongoConnString, dbName, collectionName) {
    if (!mongoConnString)
        throw new Error('Query: missing mongoConnString parameter.');
    mongo = new MongoClient(mongoConnString, { useNewUrlParser: true });
    await mongo.connect();
    return repoFunc(mongo.db(dbName).collection(collectionName));
}

module.exports = exportFunc;
