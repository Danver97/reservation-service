if(process.env.NODE_ENV !== "production")
    require("dotenv").load();

var ENV = {
    test: false,
    dburl: "",
    port: 3000
};

ENV.port = process.env.PORT || 3000;
ENV.dburl = process.env.DB_URL || "";
ENV.test = process.env.TEST || "true";

module.exports = ENV;