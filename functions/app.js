const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(express.json());

let routerApps = require('../app/routers/router.js');

app.use('/.netlify/functions/app', routerApps);

module.exports.handler = serverless(app);