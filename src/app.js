const express = require('express');
const bodyParser = require('body-parser');
const Reservation = require('../domain/models/reservation');
const QueryError = require('../infrastructure/query/query_error');

const app = express();
let reservationMgr = null;
let queryMgr = null;

// BODY-PARSER Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

function clientError(res, message, code) {
    res.status(code || 400);
    res.json({ error: message });
}

app.get('/', (req, res) => {
    res.json({ service: 'reservation-service' });
});

app.get('/reservation', async (req, res) => {
    const query = req.query;
    if (!query.resId) {
        clientError(res, 'Wrong query parameters.');
        return;
    }
    try {
        const reserv = await queryMgr.getReservation(query.resId);
        res.status(200);
        res.json(reserv);
    } catch (e) {
        if (e instanceof QueryError && e.code === 100) {
            res.status(404);
            res.json({ error: 'Reservation not found' });
            return;
        }
        res.status(500);
        res.json({ error: e });
    }
});

app.post('/reservation', async (req, res) => {
    const body = req.body;
    let reservation;
    try {
        reservation = new Reservation(body.userId, body.restId, body.reservationName, body.people, body.date, body.hour);
    } catch (e) {
        clientError(res, 'Wrong body parameters for reservation.');
        return;
    }
    try {
        await reservationMgr.reservationCreated(reservation);
        res.status(200);
        res.json({
            message: 'success',
            resId: reservation.id,
        });
    } catch (e) {
        console.log(e);
        res.status(500);
        res.json({ error: e });
    }
});

app.get('/reservations', async (req, res) => {
    const query = req.query;
    if (!query.restId) {
        clientError(res, 'Wrong query parameters.');
        return;
    }
    try {
        const reservs = await queryMgr.getReservations(query.restId);
        res.status(200);
        res.json(reservs);
    } catch (e) {
        if (e instanceof QueryError && e.code === 100) {
            res.status(404);
            res.json({ error: 'Reservation not found' });
            return;
        }
        res.status(500);
        res.json({ error: e });
    }
});


function exportFunc(reservationManager, queryManager) {
    if (!reservationManager || !queryManager)
        throw new Error(`Missing the following parameters:${reservationManager ? '' : ' reservationManager'}${queryManager ? '' : ' queryManager'}`);
    reservationMgr = reservationManager;
    queryMgr = queryManager;
    return app;
}

module.exports = exportFunc;
