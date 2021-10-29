const http = require('http');
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const morgan = require('morgan');

const socketServer = require('./App/libs/socket');
const appConfig = require('./config');
const globalErrorMiddleware = require('./App/middlewares/appErrorHandler');

const app = express();

app.use(morgan('dev'));
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

let routePath = './App/routes';
let modelPath = './App/models';

//Bootstrap models
fs.readdirSync(modelPath).forEach(function (file) {
    if (~file.indexOf('.js')) require(modelPath + '/' + file)
});
// end Bootstrap models

fs.readdirSync(routePath).forEach(function (file) {
    if (~file.indexOf('.js')) {
        let route = require(routePath + '/' + file);
        route.setRouter(app);
    }
});

app.use(globalErrorMiddleware.globalNotFoundHandler)
app.use(globalErrorMiddleware.globalErrorHandler);
const server = http.createServer(app);
// start listening to http server
server.listen(appConfig.port);
server.on('error', onError);
server.on('listening', onListening);

socketServer.setSocketServer(server)

function onError(error) {
    if (error.syscall !== 'listen') {
        console.log(error)
        throw error;
    }


    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.log(error)
            process.exit(1);
        case 'EADDRINUSE':
            console.log(error)
            process.exit(1);
        default:
            console.log(error)
            throw error;
    }
}

function onListening() {

    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    ('Listening on ' + bind);
    console.log('server listening on port ' + addr.port);
    mongoose.connect(appConfig.db.uri, (err) => {
        if (err) {
            console.log(err)
        }
        console.log('database connection open successully')
    });
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});
