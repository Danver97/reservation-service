const ENV = require("../src/env");
var dbmanager;
if(ENV.test == "dynamodb")
    dbmanager = require("dynamodb");
if(ENV.test == "true")
    dbmanager = require("./db/testdb");

const implements = require("./implements");
const Property = implements.Property;

var interface = {
    save: new Property("function", 2),
    getPreviousPendingResCount: new Property("function", 3),
    getPreviousPendingRes: new Property("function", 3),
    getReservationsFromDateToDate: new Property("function", 3),
    getReservations: new Property("function", 1),
    getReservation: new Property("function", 2)
}

implements.checkImplementation(interface, dbmanager);

module.exports = dbmanager;