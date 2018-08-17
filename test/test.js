const assert = require('assert');
const ENV = require('../src/env');
const Reservation = require("../models/reservation");
//const Table = require("../models/table");
const ReservationError = require("../errors/reservation_error");
const repo = require("../modules/repositoryManager");
const reservationMgr = require("../modules/reservationManager");

//... environment ready for other tests. Just start with 'describe(...)';