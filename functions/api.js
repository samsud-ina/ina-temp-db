const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

const { requireApiKeyAndRateLimit } = require('../app/middleware/apiGuard.js');

const allowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			// Allow server-to-server and mobile app requests without Origin header.
			if (!origin) {
				return callback(null, true);
			}

			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}

			return callback(new Error('Not allowed by CORS'));
		}
	})
);

app.use(express.json());
app.use(requireApiKeyAndRateLimit);

const routerApps = require('../app/routers/router.js');

app.use('/.netlify/functions/api', routerApps);

module.exports.handler = serverless(app);