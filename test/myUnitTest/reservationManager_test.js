const assert = require("assert");
const Reservation = require("../models/reservation");
const reservationMgr = require("../../modules/reservationManager");
const repo = require("../../modules/repositoryManager");
const ENV = require("../../src/env");

if(ENV.test === "true")
    repo.reset();

let passed = false;

function cb(err, resr) {
    //console.log(err);
    //console.log(resr);
}

let user = "pippo", restId = 1, username = "pippo", people = 4, date = "2018-07-15", hour = "15:00";
let date2 = "2018-07-16";
let timeout = 1;

function add(user, restId, username, people, date, hour){
    let res = new Reservation(user, restId, username, people, date, hour);
    reservationMgr.addReservation(res, repo, cb);
    assert.strictEqual(res.status, "pending");
}

function accept(user, restId, username, people, date, hour, expectedTable, expectedHour, expectedMin){
    let res2 = new Reservation(user, restId, username, people, date, hour);
    reservationMgr.addReservation(res2, repo, cb);
    assert.strictEqual(res2.status, "pending");
    reservationMgr.acceptReservation(res2, repo, cb);
    assert.strictEqual(res2.status, "accepted");
    assert.strictEqual(res2.tableId, expectedTable);
    assert.strictEqual(res2.date.getHours(), expectedHour);
    assert.strictEqual(res2.date.getMinutes(), expectedMin);
    
}

function fail(user, restId, username, people, date, hour){
    let res2 = new Reservation(user, restId, username, people, date, hour);
    reservationMgr.addReservation(res2, repo, cb);
    assert.strictEqual(res2.status, "pending");
    reservationMgr.acceptReservation(res2, repo, cb);
    assert.strictEqual(res2.status, "failed");
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

if (process.env.NODE_ENV_TEST === 'mytest') {
    try {
        add(user, restId, username, people, date, "15:00");
        sleep(timeout);

        accept(user, restId, username, people, date, "15:00", 4, 15,00);
        sleep(timeout);
        accept(user, restId, username, people, date, "15:45", 5, 15,45);
        sleep(timeout);
        accept(user, restId, username, people, date, "15:00", 5, 14,45);
        sleep(timeout);
        accept(user, restId, username, people, date, "15:00", 6, 15,00);
        sleep(timeout);
        fail(user, restId, username, people, date, "15:00");
        sleep(timeout);

        accept(user, restId, username, people, date, "17:00", 3, 17,00);
        sleep(timeout);
        accept(user, restId, username, people, date, "17:00", 4, 17,00);
        sleep(timeout);
        accept(user, restId, username, people, date, "16:00", 4, 16,00);
        sleep(timeout);

        //date2
        add(user, restId, username, people, date2, "16:00");
        sleep(timeout);
        add(user, restId, username, people, date2, "17:00");
        sleep(timeout);
        accept(user, restId, username, people, date, "17:00", 5, 17,00);

        passed = true;
    } catch (error) {
        console.log("\n");
        console.log(error);
        console.log("\n");
        passed = false;
    }
}


module.exports = {
    success: passed
};
