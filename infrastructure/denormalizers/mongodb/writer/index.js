const mongodb = require('mongodb');
const writerFunc = require('./writer');


async function exportFunc(urlString, dbName) {
    const url = urlString || process.env.MONGODB_URL;
    const client = new mongodb.MongoClient(url, { useNewUrlParser: true });
    await client.connect();
    const db = client.db(dbName || process.env.MICROSERVICE_NAME);
    const writer = await writerFunc(db);
    return writer;
}

module.exports = exportFunc;
