// "test": "echo \"Error: no test specified\" && exit 1"

if (process.env.NODE_ENV_TEST === 'mytest') {
    
    const reservation_test = require("./reservation_test");

    if(!reservation_test.success)
        throw new Error("Reservation test not successful.");

    const repositoryManager_test = require("./repositoryManager_test");

    if(!repositoryManager_test.success)
        throw new Error("Repository manager test not successful.");

    /*const reservationManager_test = require("./reservationManager_test");

    if(!reservationManager_test.success)
        throw new Error("Reservation manager test not successful.");*/

    console.log("UNIT TEST: SUCCESS");
}