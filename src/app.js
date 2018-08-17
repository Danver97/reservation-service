const express = require('express');
const bodyParser = require("body-parser");
const Reservation = require("../models/reservation");
const reservationMgr = require("../modules/reservationManager");
const repository = require("../modules/repositoryManager");

var app = express();

//BODY-PARSER Middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));


app.get("/", function (req, res) {
    res.json({
        service: "reservation-service"
    });
});

app.get("/reservation", async function (req, res) {
    const query = req.query;
    try {
        if (!query.restId || !query.resId) {
            throw new Error('Missing query parameters');
        }
    } catch(e) {
        res.status(500);
        res.json({
            error: 'Wrong query parameters.',
        });
        return;
    }
    try {
        const reserv = await reservationMgr.getReservation(query.restId, query.resId);
        res.status(200);
        res.json(reserv);
    } catch(e) {
        res.status(500);
        res.json({error: e});
    }
});
    
app.post("/reservation", async function (req, res) {
    let body = req.body;
    try {
        var reservation = new Reservation(body.userId, body.restId, body.reservationName, body.people, body.date, body.hour);
    } catch(e){
        res.status(500);
        res.json({error: "Wrong body parameters for reservation."});
        return;
    }
    try {
        await reservationMgr.addReservation(reservation, repository);
        res.status(200);
        res.json({
            message: 'success',
            resId: reservation.id,
        });
    } catch(e){
        res.status(500);
        res.json({error: e});
    }
});

app.get('/reservations', async function (req, res) {
    const query = req.query;
    if (!query.restId) {
        res.status(500);
        res.json({error: 'Wrong query parameters.'});
        return;
    }
    try {
        const reservs = await reservationMgr.getReservations(query.restId);
        res.status(200);
        res.json(reservs);
    } catch(e) {
        res.status(500);
        res.json({ error: e });
    }
});


module.exports = app;
