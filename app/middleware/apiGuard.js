const statusCode = require('../config/statusCode.js');

const requestBuckets = new Map();

function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }

  return request.ip || request.connection?.remoteAddress || 'unknown';
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function isRateLimited(request) {
  const windowMs = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000);
  const maxRequests = parsePositiveInt(process.env.RATE_LIMIT_MAX_REQUESTS, 120);
  const now = Date.now();
  const ip = getClientIp(request);
  const bucket = requestBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    requestBuckets.set(ip, {
      count: 1,
      resetAt: now + windowMs
    });
    return false;
  }

  bucket.count += 1;
  return bucket.count > maxRequests;
}

exports.requireApiKeyAndRateLimit = (request, response, next) => {
  if (request.method === 'OPTIONS') {
    return next();
  }

  const expectedApiKey = String(process.env.TEMP_API_KEY || '').trim();
  const providedApiKey = String(request.headers['x-api-key'] || '').trim();

  if (!expectedApiKey || providedApiKey !== expectedApiKey) {
    return response.status(statusCode.unauthorized).json({
      code: statusCode.unauthorized,
      message: 'Unauthorized'
    });
  }

  if (isRateLimited(request)) {
    return response.status(429).json({
      code: 429,
      message: 'Too many requests'
    });
  }

  return next();
};