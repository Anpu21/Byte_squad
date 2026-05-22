const cors = require('cors');  //Used to allow frontend and backend communication.
const express = require('express');

//get allowed origins from .env file
const envOrigins = (process.env.CLIENT_URL || '')
    .split(',')  //split into array of two urls
    .map(origin => origin.trim()) //remove extra spaces
    .filter(Boolean);  //remove empty items


//Create Allowed Origins Set
const allowedOrigins = new Set([
    ...envOrigins,  //Adds all origins from .env
    'http://localhost:5173',  //manually adds local frontend ports
    'http://localhost:5174',
    'http://localhost:5175'
]);

// ─── CORS (who is sending the request)─────────────────────────────────────────────────────────────────────
const corsOptions = {
    origin: (origin, callback) => {  //origin = "http://localhost:5173 / 5174 / 5175"
        const isLocalhostDev = /^http:\/\/localhost:\d+$/.test(origin || '');  //This regular expression checks: http://localhost:any_port
        if (!origin || allowedOrigins.has(origin) || isLocalhostDev) {   //!origin = null (request from non-browser) : postman/ mobile apps / backend to backend request
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],  // Content-Type: application/json , Authorization : Used for tokens
    credentials: true
};

const corsMiddleware = cors(corsOptions); //allow frontend to access backend

// ─── BODY PARSERS ─────────────────────────────────────────────────────────────
const jsonParser    = express.json();    //Convert JSON request body into a JavaScript object -- req.body.name
const urlencodedParser = express.urlencoded({ extended: true }); //Parse URL-encoded data (from forms) into req.body  -- name=John&age=20


// ─── REQUEST LOGGER (dev only) ────────────────────────────────────────────────
const requestLogger = (req, res, next) => {
    //Log incoming requests in development mode for debugging
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    }
    next();   //Moves to next middleware.  Without next() request gets stuck.
};

// ─── REGISTER ALL MIDDLEWARE INTO EXPRESS APP ───────────────────────────────────────────
const applyMiddleware = (app) => {
    app.use(corsMiddleware);
    app.use(jsonParser);
    app.use(urlencodedParser);
    app.use(requestLogger);
};

module.exports = applyMiddleware;
