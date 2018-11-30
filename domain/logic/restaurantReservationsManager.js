const Utils = require('../../lib/utils');
const ENV = require('../../src/env');

const Promisify = Utils.promisify;
const hours = Utils.hours;
const mins = Utils.mins;

let repo = null;

function getReservationsFromDateToDate(rr, from, to) {
    const sortedRes = rr.sortReservations();
    const fromTime = from.getTime();
    const toTime = to.getTime();
    return sortedRes.filter(r => r.date.getTime() >= fromTime && r.date.getTime() <= toTime);
}

function getReservationsPerTable(rr, date) {
    return Promisify(async () => {
        let result;
        try {
            const fromDate = new Date(date.getTime());
            fromDate.setHours(fromDate.getHours() - 1);
            fromDate.setMinutes(fromDate.getMinutes() - 15);

            const toDate = new Date(date.getTime());
            toDate.setHours(toDate.getHours() + 1);
            toDate.setMinutes(toDate.getMinutes() + 15);

            // const reservations = repo.getReservationsFromDateToDate(restId, fromDate, toDate);
            const reservations = getReservationsFromDateToDate(rr, fromDate, toDate);
            const resPerTable = {};
            reservations.forEach(res => {
                if (!resPerTable[res.tableId])
                    resPerTable[res.tableId] = [];
                resPerTable[res.tableId].push(res);
            });
            Object.keys(resPerTable).forEach(k => {
                resPerTable[k].sort((a, b) => {
                    if (a.date.getTime() <= b.date.getTime())
                        return -1;
                    return 1;
                });
            });
            result = resPerTable;    
        } catch (e) {
            throw e;
        }
        return result;
    });
}

function getTables(reservation, reservations /* , people */) {
    return Promisify(async () => {
        let result;
        try {
            let tables = null;
            if (ENV.test === 'true') {
                tables = await repo.getTables(reservation.restaurantId);
            } else {
                // tables = await request(https:// restaurant-service/:restId/tables(?people=:people));
                if (!tables)
                    throw new Error('Tables array not initialized');
            }
            tables.forEach(table => {
                if (!reservations[table.id])
                    table.sortKey = hours(2) + mins(30);
                else if (!reservations[table.id][1] && reservations[table.id][0]) {
                    const dist = Math.abs(reservations[table.id][0].date.getTime() - reservation.date.getTime());
                    if (dist === 0)
                        table.sortKey = 0;
                    else
                        table.sortKey = hours(1) + mins(15) + dist;
                } else if (reservations[table.id][1] && reservations[table.id][0]) {
                    if (reservations[table.id][1].date.getTime() - reservation.date.getTime() === 0)
                        table.sortKey = 0;
                    if (reservations[table.id][0].date.getTime() - reservation.date.getTime() === 0)
                        table.sortKey = 0;
                    table.sortKey = Math.abs(reservations[table.id][1].date.getTime() - reservations[table.id][0].date.getTime());
                }
            });

            tables = tables.filter(a => a.sortKey > 0);

            tables.sort((a, b) => {
                if (a.people < b.people)
                    return -1;
                if (a.people > b.people)
                    return 1;
                if (a.sortKey > b.sortKey)
                    return -1;
                if (a.sortKey < b.sortKey)
                    return 1;
                return 0;
            });
            result = tables;
        } catch (e) {
            throw e;
        }
        return result;
    });
}

function computeTable(reservations, tables, pending) {
    let tableres = null;
    let effectiveDate = null;
    // console.log('reservations[6]');
    // console.log(reservations[6] ? reservations[6] : 'undefined');
    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        if (table.people < pending.people)
            continue;
        if (!reservations[table.id] || reservations[table.id].length === 0) {
            tableres = table;
            break;
        } else if (reservations[table.id].length === 1) {
            const res = reservations[table.id][0];
            if (res.date.getTime() + hours(1) <= pending.date.getTime() || res.date.getTime() >= pending.date.getTime() + hours(1)) {
                tableres = table;
                effectiveDate = null;
                break;
            } else if (res.date.getTime() < pending.date.getTime() && res.date.getTime() + hours(1) <= pending.date.getTime() + mins(15)) {
                tableres = table;
                effectiveDate = pending.date.getTime() + mins(15);
                break;
            } else if (res.date.getTime() > pending.date.getTime() && res.date.getTime() <= pending.date.getTime() + hours(1) - mins(15)) {
                tableres = table;
                effectiveDate = pending.date.getTime() - mins(15);
                break;
            }
        } else if (reservations[table.id].length >= 3) {
            // console.log(`${table.id} length ${reservations[table.id].length}`);
            continue;
        } else {
            const prev = reservations[table.id][0];
            const next = reservations[table.id][1];
            if (prev.date.getTime() + hours(1) <= pending.date.getTime() 
                && next.date.getTime() >= pending.date.getTime() + hours(1)) {
                tableres = table;
                effectiveDate = null;
                break;
            } else if (prev.date.getTime() + hours(1) <= pending.date.getTime() - mins(15) 
                       && next.date.getTime() >= pending.date.getTime() + hours(1) - mins(15)) {
                tableres = table;
                effectiveDate = pending.date.getTime() - mins(15);
                break;
            } else if (prev.date.getTime() + hours(1) <= pending.date.getTime() + mins(15) 
                       && next.date.getTime() >= pending.date.getTime() + hours(1) + mins(15)) {
                tableres = table;
                effectiveDate = pending.date.getTime() + mins(15);
                break;
            }
        }
    }
    if (effectiveDate != null)
        effectiveDate = new Date(effectiveDate);
    return {
        table: tableres,
        effectiveDate,
    };
}

function acceptReservation(restId, reservation) {
    return Promisify(async () => {
        const rr = await repo.getReservations(restId);
        const reservationsPerTable = await getReservationsPerTable(rr, reservation.date);
        const tables = await getTables(reservation, reservationsPerTable);
        const result = computeTable(reservationsPerTable, tables, reservation);
        if (result.table) {
            reservation.accepted(result.table, result.effectiveDate);
            rr.reservationAccepted(reservation);
            await repo.reservationAccepted(rr, reservation);
            return reservation;
        }
        reservation.failed();
        rr.reservationFailed(reservation);
        await repo.reservationFailed(rr, reservation);
        return null;
    });
}

function cancelReservation(restId, reservation) {
    return Promisify(async () => {
        const rr = await repo.getReservations(restId);
        rr.reservationCancelled(reservation.id);
        reservation.cancelled();
        await repo.reservationCancelled(rr, reservation);
    });
}

function getReservations(restId) {
    return Promisify(async () => {
        const result = await repo.getReservations(restId);
        // result.reservations;
        return result.sortReservations();
    });
}

function exportFunc(db) {
    repo = db;
    return {
        acceptReservation,
        cancelReservation,
        getReservations,
    };
}

module.exports = exportFunc;
