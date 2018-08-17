const ENV = require("../src/env");
const Reservation = require("../models/reservation");
const Table = require("../models/table");
const dbmanager = require('./repositoryManager');

function addReservation(reservation, cb) {
    return new Promise(async (resolve, reject) => {
        const err = null;
        reservation.pending();
        try {
            await dbmanager.save(reservation, cb);
        } catch(e) {
            err = e;
        }
        if(err)
            reject(err);
        else
            resolve(reservation);
    });
    //return reservation;
}

function acceptReservation(reservation, cb) {
    /*let reservations = getReservationsPerTable(reservation.restaurantId, reservation.date, dbmanager);
    let tables = getTables(reservation, reservations, dbmanager, reservation.people);
    let pendingPerTablePeople = getPreviousPendingRes(reservation.restaurantId, reservation.created, reservation.date, dbmanager);
    
    //console.log("Reservations: " + JSON.stringify(reservations));
    //console.log("Pending: " + JSON.stringify(pendingPerTablePeople));
    let result = computeTable(reservations, tables, pendingPerTablePeople, reservation);

    //console.log(result);
    if (result.table) {
        reservation.accepted(result.table, result.effectiveDate);
        dbmanager.save(reservation, function (err, id) {
            cb(null, reservation); //eventPublisher.publish("reservationAccepted", reservation);
        });
    } else {
        reservation.failed();
        dbmanager.save(reservation, function (err, id) {
            let error = {
                message: "Reservation failed: no table available"
            };
            cb(error, reservation); //eventPublisher.publish("reservationFailed", err);
        });
    }*/
    return new Promise(async (resolve, reject) => {
        let err = null;
        try {
            //previous code;
            let reservations = await getReservationsPerTable(reservation.restaurantId, reservation.date, dbmanager);
            let tables = await getTables(reservation, reservations, dbmanager, reservation.people);
            let pendingPerTablePeople = await getPreviousPendingRes(reservation.restaurantId, reservation.created, reservation.date, dbmanager);

            //console.log("Reservations: " + JSON.stringify(reservations));
            //console.log("Pending: " + JSON.stringify(pendingPerTablePeople));
            let resultData = computeTable(reservations, tables, pendingPerTablePeople, reservation);

            //console.log(result);
            if (resultData.table) {
                reservation.accepted(resultData.table, resultData.effectiveDate);
                await dbmanager.save(reservation, function (err, id) {
                    if(cb && typeof cb === 'function')
                        cb(null, reservation); //eventPublisher.publish("reservationAccepted", reservation);
                });
            } else {
                reservation.failed();
                await dbmanager.save(reservation, function (err, id) {
                    let error = {
                        message: "Reservation failed: no table available"
                    };
                    err = error;
                    if(cb && typeof cb === 'function')
                        cb(error, reservation); //eventPublisher.publish("reservationFailed", err);
                });
            }
        } catch(e) {
            err = e;
        }
        if(err)
            reject(err);
        else
            resolve(reservation);
    });
    //return result;

}

function computeTable(reservations, tables, pendingPerTablePeople, pending) {
    let tableres = null;
    let effectiveDate = null;
    let finished = false;
    let totalsolutions = 0;
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        //console.log(table);
        if (!reservations[table.id]) {
            if(totalsolutions < pendingPerTablePeople[table.people])
                totalsolutions++;
            else if(table.people >= pending.people) {
                tableres = table;
                break;
            }
            
        } else if (reservations[table.id].length == 1) {
            //console.log(table.id +" length " + reservations[table.id].length);
            let res = reservations[table.id][0];
            if (res.date.getTime() + hours(1) <= pending.date.getTime() || res.date.getTime() >= pending.date.getTime() + hours(1)) {
                if(totalsolutions < pendingPerTablePeople[table.people]){
                    totalsolutions++;
                    //console.log("una res con pending " +table.id);
                } else if(table.people >= pending.people) {
                    tableres = table;
                    effectiveDate = null;
                    finished = true;
                    break;
                }
            } else if (res.date.getTime() + hours(1) <= pending.date.getTime() + mins(15) && table.people >= pending.people) {
                if(totalsolutions < pendingPerTablePeople[table.people]){///quii!
                    totalsolutions++;
                    //console.log("una res con pending +15 " +table.id);
                } else if(table.people >= pending.people) {
                    tableres = table;
                    effectiveDate = pending.date.getTime() + mins(15);
                    finished = true;
                    break;
                }
            } else if (res.date.getTime() <= pending.date.getTime() + hours(1) - mins(15) && table.people >= pending.people) {
                if(totalsolutions < pendingPerTablePeople[table.people]){///quii!
                    totalsolutions++;
                    //console.log("una res con pending -15 " +table.id);
                } else if(table.people >= pending.people) {
                    tableres = table;
                    effectiveDate = pending.date.getTime() - mins(15);
                    finished = true;
                    break;
                }
            }
        } else if (reservations[table.id].length >= 3) {
            console.log(table.id + " length " + reservations[table.id].length);
            continue;
        } else {
            for (let j = 0; j < reservations[table.id].length - 1; j++) {
                let prev = reservations[table.id][j];
                let next = reservations[table.id][j + 1];
                if (prev.date.getTime() + hours(1) <= pending.date.getTime() &&
                    next.date.getTime() >= pending.date.getTime() + hours(1)) {
                    if(totalsolutions < pendingPerTablePeople[table.people]){///quii!
                        totalsolutions++;
                        //console.log("due res con pending " +table.id);
                        break;
                    } else if(table.people >= pending.people) {
                        tableres = table;
                        effectiveDate = null;
                        finished = true;
                        break;
                    }
                    //console.log("due res no " + table.id);
                    /*if (num_pendings > 0){
                        num_pendings--;
                        break;
                    }
                    tableres = table;
                    effectiveDate = null;
                    finished = true;*/
                } else if (prev.date.getTime() + hours(1) <= pending.date.getTime() - mins(15) &&
                    next.date.getTime() >= pending.date.getTime() + hours(1) - mins(15)) {
                    if(totalsolutions < pendingPerTablePeople[table.people]){///quii!
                        totalsolutions++;
                        //console.log("due res con pending -15 " + table.id);
                        break;
                    } else if(table.people >= pending.people) {
                        //console.log("due res -15 " + table.id);
                        tableres = table;
                        effectiveDate = pending.date.getTime() - mins(15);
                        finished = true;
                        break;
                    }
                    //console.log("due res no -15 " + table.id);
                    /*if (num_pendings > 0){
                        num_pendings--;
                        break;
                    }
                    tableres = table;
                    effectiveDate = pending.date.getTime() - mins(15);
                    finished = true;*/
                } else if (prev.date.getTime() + hours(1) <= pending.date.getTime() + mins(15) &&
                    next.date.getTime() >= pending.date.getTime() + hours(1) + mins(15)) {
                    if(totalsolutions < pendingPerTablePeople[table.people]){///quii!
                        totalsolutions++;
                        //console.log("due res con pending  +15 " +table.id);
                        break;
                    } else if(table.people >= pending.people) {
                        tableres = table;
                        effectiveDate = pending.date.getTime() + mins(15);
                        finished = true;
                        break;
                    }
                    //console.log("due res no +15 " + table.id);
                    /*if (num_pendings > 0){
                        num_pendings--;
                        break;
                    }
                    tableres = table;
                    effectiveDate = pending.date.getTime() + mins(15);
                    finished = true;*/
                }
            }
        }
        if (finished)
            break;
    }
    if(effectiveDate != null)
        effectiveDate = new Date(effectiveDate);
    return {
        table: tableres,
        effectiveDate: effectiveDate
    };
}

function getTables(reservation, reservations, people) {
    return new Promise(async (resolve, reject) => {
        let err = null;
        let result;
        try {
            let tables = null;
            if (ENV.test == "true") {
                //tables = dbmanager.getTables(reservation.restaurantId);
                tables = await dbmanager.getTables(reservation.restaurantId);
            } else {
                //tables = await request(https://restaurant-service/:restId/tables(?people=:people));
                if (!tables)
                    throw new Error("Tables array not initialized");
            }
            tables.forEach(function (table) {
                if (!reservations[table.id]) {
                    table.sortKey = hours(2) + mins(30);
                } else if (!reservations[table.id][1] && reservations[table.id][0]) {
                    /*console.log("SORT KEY");
                    console.log(reservations[table.id]);
                    console.log(reservation);
                    console.log("--------");*/
                    let dist = Math.abs(reservations[table.id][0].date.getTime() - reservation.date.getTime());
                    if (dist == 0)
                        table.sortKey = 0;
                    else
                        table.sortKey = hours(1) + mins(15) + dist;
                } else if (reservations[table.id][1] && reservations[table.id][0]) {
                    if (reservations[table.id][1].date.getTime() - reservation.date.getTime() == 0)
                        table.sortKey = 0;
                    if (reservations[table.id][0].date.getTime() - reservation.date.getTime() == 0)
                        table.sortKey = 0;
                    /*console.log("SORT KEY");
                    console.log(reservations[table.id][0]);
                    console.log(reservations[table.id][1]);
                    console.log(reservation);
                    console.log("--------");*/
                    table.sortKey = Math.abs(reservations[table.id][1].date.getTime() - reservations[table.id][0].date.getTime());
                }
            });

            tables = tables.filter(function (a) {
                return a.sortKey > 0;
            });

            tables.sort(function (a, b) {
                if(a.people < b.people)
                    return -1;
                else if(a.people > b.people)
                    return 1;
                else if (a.sortKey > b.sortKey)
                    return -1;
                else if (a.sortKey < b.sortKey)
                    return 1;
                return 0;
            });
            result = tables;
        } catch(e) {
            err = e;
        }
        if(err)
            reject(err);
        else
            resolve(result);
    });
    //console.log(tables);
    //return tables;
}

function getPreviousPendingRes(restId, created, date) {
    return dbmanager.getPreviousPendingRes(restId, created, date);
}

function getReservationsPerTable(restId, date) {

    return new Promise(async (resolve, reject) => {
        let err = null;
        let result;
        try {
            //previous code;
            let fromDate = new Date(date.getTime());
            fromDate.setHours(fromDate.getHours() - 1);
            fromDate.setMinutes(fromDate.getMinutes() - 15);

            let toDate = new Date(date.getTime());
            toDate.setHours(toDate.getHours() + 1);
            toDate.setMinutes(toDate.getMinutes() + 15);

            //let reservations = dbmanager.getReservationsFromDateToDate(restId, fromDate, toDate);
            let reservations = await dbmanager.getReservationsFromDateToDate(restId, fromDate, toDate);
            let resPerTable = {};
            reservations.forEach(function (res) {
                if (!resPerTable[res.tableId])
                    resPerTable[res.tableId] = []
                resPerTable[res.tableId].push(res);
            });
            Object.keys(resPerTable).forEach((k) => {
                resPerTable[k].sort((a,b)=>{
                    if(a.date.getTime()<=b.date.getTime())
                        return -1;
                    return 1;
                });
            });
            result = resPerTable;
            
        } catch(e) {
            err = e;
        }
        if(err)
            reject(err);
        else
            resolve(result);
    });
    //return resPerTable;
}

function getReservations(restId) {
    return dbmanager.getReservations(restId);
}

function getReservation(restId, resId) {
    return dbmanager.getReservation(restId, resId);
}

function mins(qty) {
    return qty * 60 * 1000;
}

function hours(qty) {
    return mins(qty * 60);
}

module.exports = {
    addReservation: addReservation,
    acceptReservation: acceptReservation,
    getReservation,
    getReservations,
};
