class Table {
    constructor(id, restaurantId, people) {
        if (!id || !restaurantId || !people)
            throw new Error('Invalid Table object constructor parameters.');
        this.id = id;
        this.restaurantId = restaurantId;
        this.people = people;
    }
}

module.exports = Table;
