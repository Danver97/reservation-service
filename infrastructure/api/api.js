const express = require('express');
const bodyParser = require('body-parser');
const Reservation = require('../../domain/models/reservation');
const QueryError = require('../query/query_error');
const ReservationManagerError = require('../../domain/errors/reservationManager_error');

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

app.get('/reservation-service', (req, res) => {
    res.json({ service: 'reservation-service' });
});

app.get('/reservation-service/healthcheck', (req, res) => {
    res.json({ service: 'reservation-service', healthcheck: 'success' });
});

app.post('/reservation-service/reservationDemo', (req, res) => {
    const body = req.body;
    /* const demoBody = {
        "restId":"0eb893e2-c57c-4996-a5c5-0fd30da5be88",
        "peopleNumber":2,
        "userId":"testUserId",
        "reservationName":"testReservationName",
        "date":"2019-09-18T10:00:00.000Z"
    } */
    const dateRegExp = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ$/;
    if (typeof body.restId === 'string'
        && typeof body.peopleNumber === 'number'
        && typeof body.userId === 'string'
        && typeof body.reservationName === 'string'
        && typeof body.date === 'string' && dateRegExp.test(body.date))
        res.json({ result: 'success' });
    else
        clientError(res, 'Wrong body params');
});

app.get('/reservation-service/reservations', async (req, res) => {
    const query = req.query;
    if (!query.restId && !query.userId) {
        clientError(res, 'Wrong query parameters.');
        return;
    }
    try {
        let reservs;
        if (query.restId)
            reservs = await queryMgr.getReservations(query.restId);
        else if (query.userId)
            reservs = await queryMgr.getUserReservations(query.userId);
        res.status(200);
        res.json(reservs);
    } catch (e) {
        if (e instanceof QueryError && e.code === QueryError.reservationsNotFoundErrorCode) {
            clientError(res, `${query.restId ? 'Restaurant' : 'User'} not found`, 404);
            return;
        }
        res.status(500);
        res.json({ error: e });
    }
});

app.post('/reservation-service/reservations', async (req, res) => {
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
        if (e instanceof ReservationManagerError && e.code === ReservationManagerError.restaurantDoesNotExistErrorCode) {
            clientError(res, 'The restaurant indicated in the reservation does not exist', 400);
            return;
        }
        console.log(e);
        res.status(500);
        res.json({ error: e });
    }
});

app.get('/reservation-service/reservations/:resId', async (req, res) => {
    const params = req.params;
    if (!params.resId) {
        clientError(res, 'Missing resId parameters.');
        return;
    }
    try {
        const reserv = await queryMgr.getReservation(params.resId);
        res.status(200);
        res.json(reserv);
    } catch (e) {
        if (e instanceof QueryError && e.code === QueryError.reservationNotFoundErrorCode) {
            clientError(res, 'Reservation not found', 404);
            return;
        }
        res.status(500);
        res.json({ error: e });
    }
});

app.get('/reservation-service/reservations/:resId/status', async (req, res) => {
    const params = req.params;
    if (!params.resId) {
        clientError(res, 'Missing resId parameters.');
        return;
    }
    try {
        const reserv = await queryMgr.getReservation(params.resId);
        res.status(200);
        res.json({ resId: reserv.id, status: reserv.status });
    } catch (e) {
        if (e instanceof QueryError && e.code === QueryError.reservationNotFoundErrorCode) {
            clientError(res, 'Reservation not found', 404);
            return;
        }
        res.status(500);
        res.json({ error: e });
    }
});

app.put('/reservation-service/reservations/:resId/status', async (req, res) => {
    const params = req.params;
    if (!params.resId) {
        clientError(res, 'Missing resId parameters.');
        return;
    }
    const body = req.body;
    try {
        switch (body.status) {
            /* case 'accepted':
                if (!body.restId)
                    clientError(res, 'Wrong body properties');
                await reservationMgr.acceptReservation(body.restId, params.resId);
                break; */
            case 'cancelled':
                await reservationMgr.reservationCancelled(params.resId);
                break;
            default:
                clientError(res, 'Wrong body properties');
                return;
        }
        res.status(200);
        res.end();
    } catch (e) {
        if (e instanceof QueryError && e.code === QueryError.notFoundErrorCode) {
            clientError(res, 'Reservation not found', 404);
            return;
        }
        console.log(e);
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
