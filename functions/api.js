const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const routerApps = require('../app/routers/router.js');

app.use('/.netlify/functions/api', routerApps);

module.exports.handler = serverless(app);