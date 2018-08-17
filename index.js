const app = require("./src/app");
const ENV = require("./src/env");

app.listen(ENV.port, () => {
   console.log("Server started on port " + ENV.port);
});