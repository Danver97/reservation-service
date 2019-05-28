const handlerFunc = require('./handler');
const orderControlFunc = require('./orderControl');
const writerFunc = require('./writer');

const orderCtrlTable = process.env.ORDER_CTRL_TABLE;
const writerOptions = {
    url: process.env.MONGODB_URL,
    db: process.env.MONGODB_DB,
    collection: process.env.MONGODB_COLLECTION,
};
const writer = writerFunc(writerOptions);

const orderControl = orderControlFunc(orderCtrlTable);

const handler = handlerFunc(writer, orderControl);

/*
TODO:
- Migliorare il writer: questo deve avere tutto l'occorrente per gestire le connessioni 
  e controllare che vi sia sempre una connessione tra mongoDB e la funzione                 (DONE)

- Introdurre l'order control attraverso un costante conditional update su DynamoDB:
  - Il modulo che si occupa dell'effettiva query di DynamoDB può essere a sè stante         (DONE)
  - L'order control va implementato nell'handler:                                           (DONE)
    - Controlla se l'evento è ricevuto in ordine all'interno del suo stream
    - Denormalizza
    - Fa l'update condizionale su DynamoDB
*/
exports.mongoDenormalizer = async function(event, context) {
    const messages = event.Records.map(e => JSON.parse(e.body));
    const promises = [];
    for (let m of messages) {
        promises.push(handler(m));
    }
    await Promise.all(promises);
}