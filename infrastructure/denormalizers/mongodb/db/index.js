module.exports = function (dbname) {
    const dbName = dbname || process.env.ORDER_CONTROL_DB;
    switch (dbname) {
        case 'testdb':
            return require('./testdb');
        case 'dynamodb':
            return require('./dynamodb');
        default:
    }
}
