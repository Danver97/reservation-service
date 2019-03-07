const express = require('express');
const bodyParser = require('body-parser');
const Reservation = require('../domain/models/reservation');

const app = express();
let reservationMgr = null;

// BODY-PARSER Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
    res.json({ service: 'reservation-service' });
});

app.get('/reservation', async (req, res) => {
    const query = req.query;
    try {
        if (!query.restId || !query.resId)
            throw new Error('Missing query parameters');
    } catch (e) {
        res.status(500);
        res.json({ error: 'Wrong query parameters.' });
        return;
    }
    try {
        const reserv = await reservationMgr.getReservation(query.restId, query.resId);
        res.status(200);
        res.json(reserv);
    } catch (e) {
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
        res.status(500);
        res.json({ error: 'Wrong body parameters for reservation.' });
        return;
    }
    try {
        await reservationMgr.acceptReservation(reservation.restId, reservation);
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
        res.status(500);
        res.json({ error: 'Wrong query parameters.' });
        return;
    }
    try {
        const reservs = await reservationMgr.getReservations(query.restId);
        res.status(200);
        res.json(reservs);
    } catch (e) {
        res.status(500);
        res.json({ error: e });
    }
});


function exportFunc(manager) {
    if (!manager)
        throw new Error('Missing manager param');
    reservationMgr = manager;
    return app;
}

module.exports = exportFunc;
