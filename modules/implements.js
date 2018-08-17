class Property {
    constructor(type, args){
        this.type = type;
        this.args = args;
        this.implemented = false;
    }
}
/*
var interface = {
    save: new Property("function", 2),
    getPreviousPendingResCount: new Property("function", 1),
    getReservationsFromDateToDate: new Property("function", 3)
}*/

function checkImplementation(interface, implementation){
    Object.entries(implementation).forEach(function([key, value]){
        if(!interface[key])
            return;
        if(typeof value !== interface[key].type)
            throw new Error("The dbmanager implementation of " + key + " don't satisfy the type of the property: required type " + interface[key].type);
        if(typeof value === "function" && value.length != interface[key].args)
            throw new Error("The dbmanager implementation of " + key + " don't satisfy the number of parameters: required " + interface[key].args + "parameters.");
        interface[key].implemented = true;
    });

    Object.getOwnPropertyNames(interface).forEach(function(prop){
        implemented = interface[prop].implemented;
        if(!implemented)
            throw new Error("The dbmanager implementation don't satisfy the required interface: missing " + prop);
    });
    
}

module.exports = {Property: Property, checkImplementation: checkImplementation};



