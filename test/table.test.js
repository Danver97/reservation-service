const assert = require('assert');
const uuid = require('uuid/v4');
const Table = require('../domain/models/table');
const TableError = require('../domain/errors/table_error');
const Reservation = require('../domain/models/reservation');

describe('Table class unit test', function () {

    it('check if constructor works', function () {
        assert.throws(() => new Table(), TableError);
        const id = 1;
        const restId = uuid();
        const people = 4;
        const table = new Table(id, restId, people);
        assert.strictEqual(table.id, id);
        assert.strictEqual(table.restId, restId);
        assert.strictEqual(table.people, people);
    });

    it('check if addReservation works', function () {
        const id = 1;
        const restId = uuid();
        const people = 4;
        const table = new Table(id, restId, people);
        assert.throws(() => table.addReservation(), TableError);

        const r = new Reservation(uuid(), uuid(), 'Franco', table.people, new Date(), '15:15');
        table.addReservation(r);

        const result = table.getReservations()[0];
        assert.deepStrictEqual(result, r);
    });

    it('check if removeReservation works', function () {
        const id = 1;
        const restId = uuid();
        const people = 4;
        const table = new Table(id, restId, people);
        assert.throws(() => table.removeReservation(), TableError);
        const r = new Reservation(uuid(), uuid(), 'Franco', table.people, new Date(), '15:15');
        table.addReservation(r);

        table.removeReservation(r.id);

        const result = table.getReservations()[0];
        assert.deepStrictEqual(result, undefined);
    });

    it('check serialization', function () {
        const id = 1;
        const restId = uuid();
        const people = 4;
        const table = new Table(id, restId, people);
        const r = new Reservation(uuid(), uuid(), 'Franco', table.people, new Date(), '15:15');
        table.addReservation(r);

        const json = {
            id: table.id,
            restId: table.restId,
            people: table.people,
            reservations: table.getReservations(),
        }

        assert.strictEqual(table.toString(), JSON.stringify(json));
    });
});