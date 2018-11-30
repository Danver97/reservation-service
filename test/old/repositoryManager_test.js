const assert = require("assert");
const Reservation = require("../../domain/models/reservation");
const repo = require("../../infrastructure/repository/repositoryManager");
const ENV = require("../../src/env");

if(ENV.test === "true")
    repo.reset();

let passed = false;
let timeout = 0;

function cb(err, resr) {
    //console.log(err);
    //console.log(resr);
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
        let tomorrow = new Date(Date.now());
        tomorrow.setDate(tomorrow.getDate()+1);

        let res = new Reservation("pippo", 1, "pippo", 1, tomorrow.toLocaleDateString(), "15:00");
        res.pending();
        repo.save(res, cb);
        let filterDate = new Date(res.created.getTime());
        filterDate.setMinutes(filterDate.getMinutes() + 1);
        assert.strictEqual(repo.getPreviousPendingResCount(1, filterDate, res.date),1);
        //sleep(timeout);

        let res2 = new Reservation("pippo2", 1, "pippo", 2, tomorrow.toLocaleDateString(), "15:00");
        res2.pending();
        repo.save(res2, cb);
        filterDate = new Date(res2.created.getTime());
        filterDate.setMinutes(filterDate.getMinutes() + 1);
        assert.strictEqual(JSON.stringify(repo.getPreviousPendingRes(1, filterDate, res.date)),JSON.stringify({"0":0, "1":1, "2":2}));
        //sleep(timeout);

        res2.accepted({id: 1, people:4}, null);
        repo.save(res2,cb);
        repo.getPreviousPendingRes(1, filterDate, res.date);
        let fromDate = new Date(res2.date.getTime());
        fromDate.setHours(fromDate.getHours()-1);
        let toDate = new Date(res2.date.getTime());
        toDate.setHours(toDate.getHours()+1);
        assert.strictEqual(repo.getReservationsFromDateToDate(1,fromDate, toDate).length,1);
        assert.strictEqual(JSON.stringify(repo.getReservationsFromDateToDate(1,fromDate, toDate)),JSON.stringify([res2]));

        assert.strictEqual(JSON.stringify(repo.getReservations(res2.restaurantId)),JSON.stringify([res2]));
        assert.strictEqual(JSON.stringify(repo.getPreviousPendingRes(1, filterDate, res.date)),JSON.stringify({"0":0, "1":1}));

        res.accepted({id: 2, people:4}, null);
        repo.save(res,cb);
        assert.strictEqual(JSON.stringify(repo.getPreviousPendingRes(1, filterDate, res.date)),JSON.stringify({"0":0}));
        assert.strictEqual(repo.getReservationsFromDateToDate(1,fromDate, toDate).length,2);

        passed = true;
    } catch (err) {
        console.log(err);
        passed = false;
    }
}


module.exports = {success: passed};