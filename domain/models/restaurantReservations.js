const RestaurantReservationError = require('../errors/restaurantReservations_error');
const Reservation = require('./reservation');
const Table = require('./table');

const slotLength = 15;
const resLength = slotLength * 4;

function min(m) {
    return m * 60 * 1000;
}

const acceptationModes = {
    MANUAL: 'MANUAL',
    AUTO_THRESHOLD: 'AUTO_THRESHOLD',
    // AUTO_TABLE_ASSIGNMENT: 'AUTO_TABLE_ASSIGNMENT',
}


class RestaurantReservations {
    /**
     * @constructor
     * @param {object} options 
     * @param {string} options.restId The restaurant id
     * @param {object} options.timeTable The timetable of the restaurant
     * @param {string} [options.acceptationMode] The type of acceptation used to accept new reservations. Default: 'MANUAL'.
     * @param {Table[]} [options.tables] The tables available in the restaurant
     * @param {number} [options.threshold] The number of seats reservable. Default: 20.
     * @param {number} [options.maxReservationSize] The maximum number of people after which a reservation requires a manual acceptation. Default: 10.
     * @param {number} [options.reservationLength] The duration of a single reservation in minutes. Default: 60.
     */
    constructor(options = {}) {
        // Assign default values
        const defaultValues = {
            acceptationMode: acceptationModes.MANUAL,
            tables: [],
            threshold: 20,
            maxReservationSize: 10,
            reservationLength: resLength,
        };
        options = Object.assign(defaultValues, options);
        
        this._checkConstrParams(options);

        const { restId, timeTable, acceptationMode, tables, threshold, maxReservationSize, reservationLength } = options;

        this.restId = restId;
        this.setTimeTable(timeTable);
        this.acceptationMode = acceptationMode;
        this.setTables(tables);
        this.threshold = threshold;
        this.maxReservationSize = maxReservationSize;
        this.reservationLength = reservationLength;

        this.reservationMap = {}; // Used to keep track of already added reservations.

        if (this.acceptationMode === acceptationModes.AUTO_THRESHOLD)
            this.timeSlotsPeople = {};
        // if (this.acceptationMode === acceptationModes.AUTO_TABLE_ASSIGNMENT)
    }

    _checkConstrParams(options) {
        const { restId, timeTable, acceptationMode, tables, threshold, maxReservationSize, reservationLength } = options;
        if (!restId || !timeTable || !threshold) {
            throw RestaurantReservationError.paramError(`Invalid Reservation object constructor parameters. Missing the following parameters:
                ${restId ? '' : ' restId'}
                ${timeTable ? '' : ' timeTable'}
                ${threshold ? '' : ' threshold'}`);
        }
        if (typeof restId !== 'string')
            throw RestaurantReservationError.paramError(`'restId' must be a string`);
        this._checkTimeTable(timeTable);
        this._checkAcceptationMode(acceptationMode);

        this._checkTables(tables);
        if (typeof threshold !== 'number')
            throw RestaurantReservationError.paramError(`'threshold' must be a number`);
        if (typeof maxReservationSize !== 'number')
            throw RestaurantReservationError.paramError(`'maxReservationSize' must be a number`);
        if (typeof reservationLength !== 'number' || reservationLength % slotLength !== 0)
            throw RestaurantReservationError.paramError(`'reservationLength' must be a number multiple of 15`);
    }

    _checkTimeTable(timeTable) {
        if (typeof timeTable !== 'object')
            throw RestaurantReservationError.paramError(`'timeTable' must be an instance of TimeTable`);
    }

    _checkTables(tables) {
        if (!Array.isArray(tables))
            throw RestaurantReservationError.paramError(`'tables' must be an array of Tables`);
    }

    _checkAcceptationMode(mode) {
        if (!acceptationModes[mode])
            throw RestaurantReservationError.paramError(`'acceptationMode' not valid. Must be one of the following: ${Object.keys(acceptationModes)}`);
    }

    _checkReservation(res) {
        if (!res)
            throw RestaurantReservationError.paramError(`Missing the following parameters: reservation`);
        if (!(res instanceof Reservation))
            throw RestaurantReservationError.paramError("'reservation' must be instance of Reservation class");
    }

    static get acceptationModes() {
        return Object.assign({}, acceptationModes);
    }

    // setters

    setTimeTable(timeTable) {
        if (!timeTable)
            throw RestaurantReservationError.paramError(`Missing the following parameters: timeTable`);
        this._checkTimeTable(timeTable);
        this.timeTable = timeTable;
    }

    setTables(tables) {
        if (!tables)
            throw RestaurantReservationError.paramError(`Missing the following parameters: tables`);
        this._checkTables(tables);

        this.tables = tables.map(t => Table.fromObject(t));
        this.tables.sort((a, b) => (a.people <= b.people ? -1 : 1));
        this.tablesMap = {};
        this.tables.forEach(t => { this.tablesMap[t.id] = t; });
    }

    _checkIfResAlreadyPresent(res) {
        if (this.reservationMap[res.id])
            throw RestaurantReservationError.reservationAlreadyAddedError(`Reservation with id ${res.id} already added`);
    }
    _checkIfResNotPresent(resId) {
        if (!this.reservationMap[resId])
            throw RestaurantReservationError.reservationNotFoundError(`Reservation with id ${resId} not found`);
    }

    _acceptReservationUtility(res, manual) {
        this._checkReservation(res);
        if (res.status !== 'pending')
            throw RestaurantReservationError.reservationStatusError(`The reservation must be in a 'pending' status.`);

        switch(this.acceptationMode) {
            case acceptationModes.MANUAL:
                this._acceptManual(res, manual);
                break;
            case acceptationModes.AUTO_THRESHOLD:
                this._acceptAutoThreshold(res, manual);
                break;
            /* case acceptationModes.AUTO_TABLE_ASSIGNMENT:
                this._addByTables(res, manual);
                break; */
        }
    }

    _removeReservationUtility(resId) {
        switch(this.acceptationMode) {
            case acceptationModes.MANUAL:
                this._removeManual(resId);
                break;
            case acceptationModes.AUTO_THRESHOLD:
                this._removeAutoThreshold(resId);
                break;
            /* case acceptationModes.AUTO_TABLE_ASSIGNMENT:
                this._removeByTables(res, manual);
                break; */
        }
    }

    _acceptManual(res, manual) {
        this._checkIfResAlreadyPresent(res);
        this.reservationMap[res.id] = res;
    }

    _removeManual(resId) {
        this._checkIfResNotPresent(resId);
        delete this.reservationMap[resId];
    }

    _acceptAutoThreshold(res, manual) {
        this._checkIfResAlreadyPresent(res);
        if (!manual && res.people > this.maxReservationSize)
            throw RestaurantReservationError.resTooBigForAutoAcceptError(`Reservation is too big for being accepted automatically. Res size: ${res.people}`);

        const endOfRes = res.date.getTime() + min(this.reservationLength);
        let cursor = res.date.getTime();

        if (!manual) { // If the accept request is manual, skips checks.
            // Checks if the threshold is not broken in the timeslots covered by the reservation
            while (cursor < endOfRes) {
                if (!this.timeSlotsPeople[cursor] || isNaN(this.timeSlotsPeople[cursor]))
                    this.timeSlotsPeople[cursor] = 0;
                // console.log(cursor, this.timeSlotsPeople[cursor] + res.people, this.threshold)
                if (this.timeSlotsPeople[cursor] + res.people > this.threshold)
                    throw RestaurantReservationError.reservationNotAcceptableError(`The reservation ${res.id} exceeds the threshold ${this.threshold} in the time slot ${new Date(cursor)}`);
                cursor += min(slotLength);
            }
        }


        // Adds the peoples in the timeslots covered by the reservation
        cursor = res.date.getTime();
        while (cursor < endOfRes) {
            if (!this.timeSlotsPeople[cursor] || isNaN(this.timeSlotsPeople[cursor]))
                this.timeSlotsPeople[cursor] = 0;
            this.timeSlotsPeople[cursor] += res.people;
            cursor += min(slotLength);
        }

        this.reservationMap[res.id] = res;
    }

    _removeAutoThreshold(resId) {
        this._checkIfResNotPresent(resId);

        const res = this.reservationMap[resId];
        const endOfRes = res.date.getTime() + min(this.reservationLength);
        let cursor = res.date.getTime();
        // Removes the peoples in the timeslots covered by the reservation
        while (cursor < endOfRes) {
            this.timeSlotsPeople[cursor] -= res.people;
            cursor += min(slotLength);
        }
        delete this.reservationMap[res.id];
    }


    /**
     * 
     * @param {Reservation} res 
     */
    acceptReservation(res) {
        this._acceptReservationUtility(res, false);
        res.confirmed();
    }

    /**
     * Overrides any automatic acceptation check and adds the reservation to the restaurant
     * @param {Reservation} res 
     */
    acceptReservationManually(res) { // O(1)
        this._acceptReservationUtility(res, true);
        res.confirmed();
    }

    removeReservation(resId) { // O(1)
        if (!resId)
            throw RestaurantReservationError.paramError(`Missing the following parameters: resId`);
        this._removeReservationUtility(resId);
    }

    changeAcceptationMode(newMode) {
        this._checkAcceptationMode(newMode);

        const currentMode = this.acceptationMode;
        this.acceptationMode = newMode;

        // Inits or cleans up datastructures
        switch(newMode) {
            case acceptationModes.MANUAL:
                if (currentMode === acceptationModes.AUTO_THRESHOLD)
                    delete this.timeSlotsPeople;
                break;
            case acceptationModes.AUTO_THRESHOLD:
                if (currentMode === acceptationModes.MANUAL)
                    this.timeSlotsPeople = {};
                break;
        }

        // Builds the necessary datastructures in order to be ready to check the next incoming reservation
        const reservations = Object.values(this.reservationMap);
        this.reservationMap = {};
        reservations.forEach(r => this._acceptReservationUtility(r, true));
    }

    // Legacy methods

    getTables(people = 0) { // O(N) - N: total tables
        let index = 0;
        for (index = 0; index < this.tables.length; index++) {
            if (this.tables[index].people >= people)
                break;
        }
        return this.tables.slice(index, this.tables.length);
    }
}

module.exports = RestaurantReservations;
