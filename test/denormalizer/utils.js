const tipicalDay = {
    morning: {
        open: '10:00',
        close: '14:00',
    },
    afternoon: {
        open: '18:00',
        close: '23:00',
    }
};
const timeTable = {
    Monday: 'closed',
    Tuesday: 'closed',
    Wednesday: tipicalDay,
    Thursday: tipicalDay,
    Friday: tipicalDay,
    Saturday: tipicalDay,
    Sunday: tipicalDay,
};

module.exports = {
    timeTable,
};
