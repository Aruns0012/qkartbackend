const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");

let server;

// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Create Mongo connection and get the express app to listen on config.port

mongoose.connect(config.mongoose.url, config.mongoose.options).then(()=>{
    server = app.listen(config.port, ()=>{
        console.log(`listening on port ${config.port}`);
    })
})


process.on("SIGINT",()=>{
    mongoose.connections.close(()=>{
        console.log("mongoose connection cloased");
        process.exit(0);
    });
});
