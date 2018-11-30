const assert = require('assert');
const ENV = require('../src/env');
const Reservation = require('../domain/models/reservation');
//const Table = require('../domain/models/table');
const ReservationError = require('../domain/errors/reservation_error');
const repo = require('../infrastructure/repository/repositoryManager');
const reservationMgr = require('../domain/logic/restaurantReservationsManager');

//... environment ready for other tests. Just start with 'describe(...)';