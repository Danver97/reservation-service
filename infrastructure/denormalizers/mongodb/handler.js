const Promisify = require('promisify-cb');

const dependencies = {
    projector: null,
};

function reservationCreated(e, cb) {
    return Promisify(async () => {
        const reservation = e.payload;
        await dependencies.projector.reservationCreated(reservation);
    }, cb);
}

function reservationConfirmed(e, cb) {
    return Promisify(async () => {
        const resId = e.payload.resId;
        await dependencies.projector.reservationConfirmed(resId, e.eventId - 1, e.payload);
    }, cb);
}

function reservationRejected(e, cb) {
    return Promisify(async () => {
        const resId = e.payload.resId;
        const status = e.payload.status;
        await dependencies.projector.reservationRejected(resId, e.eventId - 1, status);
    }, cb);
}

function reservationCancelled(e, cb) {
    return Promisify(async () => {
        const resId = e.payload.resId;
        const status = e.payload.status;
        await dependencies.projector.reservationCancelled(resId, e.eventId - 1, status);
    }, cb);
}

function restaurantReservationsCreated(e, cb) {
    return Promisify(async () => {
        const rr = e.payload;
        await dependencies.projector.restaurantReservationsCreated(rr);
    }, cb);
}

function reservationAdded(e, cb) {
    return Promisify(async () => {
        const restId = e.streamId;
        const reservation = e.payload;
        await dependencies.projector.reservationAdded(restId, e.eventId - 1, reservation);
    }, cb);
}

function reservationRemoved(e, cb) {
    return Promisify(async () => {
        const restId = e.payload.restId;
        const resId = e.payload.resId;
        await dependencies.projector.reservationRemoved(restId, e.eventId - 1, resId);
    }, cb);
}

const handlersMap = {
    reservationCreated,
    reservationConfirmed,
    reservationRejected,
    reservationCancelled,
    restaurantReservationsCreated,
    reservationAdded,
    reservationRemoved,
};

async function acknoledgeUtil(ackFunc, ack) {
    if (ack && typeof ackFunc === 'function') {
        await ackFunc();
    } else if (!ack) {
        // If the queue requires acknolegde to remove events, doesn't acknoledges it not calling ackFunc()
        // If the queue requires success of the function to remove events, throws an error
        if (typeof ackFunc !== 'function')
            throw new Error('EventId too much ahead of the expected eventId');
    }

}

function acknoledge(akcFunc) {
    return acknoledgeUtil(akcFunc, true);
}

function dontAcknoledge(akcFunc) {
    return acknoledgeUtil(akcFunc, false);
}

async function handler(e, ack) {
    if (!e)
        return;
    if (typeof handlersMap[e.message] === 'function') {
        const lastEventId = (await dependencies.orderCtrl.getLastProcessedEvent(e.streamId)).eventId;
        // If it is and old event
        if (e.eventId <= lastEventId) {
            // Removes it from the queue without processing it
            await acknoledge(ack);
            return;
        }

        // If it is a too young event
        if (e.eventId > lastEventId + 1) {
            // Ignore it
            await dontAcknoledge(ack);
            return;
        }

        // If it is the next event that needs to be processed
        if (e.eventId === lastEventId + 1) {
            // Process it
            await handlersMap[e.message](e);
            await dependencies.orderCtrl.updateLastProcessedEvent(e.streamId, lastEventId);
            await acknoledge(ack);
        }
    }
}

function exportFunc(writer, orderCtrl) {
    dependencies.projector = writer;
    dependencies.orderCtrl = orderCtrl;
    if (!dependencies.projector || !dependencies.orderCtrl) {
        throw new Error(`HandlerError: Missing one or more of the following parameters:
        ${dependencies.projector ? '' : 'writer'}
        ${dependencies.orderCtrl ? '' : 'orderCtrl'}`);
    }
    return handler;
}

module.exports = exportFunc;
