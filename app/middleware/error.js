const statusCode = require('../config/statusCode.js');

exports.handleError = (error, response) => {
    if (error && !response.headersSent) {
        return response.status(statusCode.bad_request).json({
            code: statusCode.bad_request,
            message: error.message,
            error: error
        });
    }
};