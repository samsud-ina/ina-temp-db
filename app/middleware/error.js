const statusCode = require('../config/statusCode.js');

function mapErrorToHttpStatus(error) {
    if (error && Number.isInteger(error.statusCode)) {
        return error.statusCode;
    }

    const code = error && error.code;

    switch (code) {
        case 'ER_DUP_ENTRY':
            return 409;
        case 'ER_NO_REFERENCED_ROW_2':
        case 'ER_ROW_IS_REFERENCED_2':
            return 409;
        case 'ER_BAD_NULL_ERROR':
        case 'ER_TRUNCATED_WRONG_VALUE':
        case 'ER_WRONG_VALUE_FOR_TYPE':
        case 'ER_PARSE_ERROR':
        case 'ER_DATA_TOO_LONG':
            return statusCode.bad_request;
        default:
            return statusCode.internal_server_error;
    }
}

exports.handleError = (error, response) => {
    if (!error || response.headersSent) {
        return;
    }

    const httpStatus = mapErrorToHttpStatus(error);
    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    const message =
        httpStatus >= 500
            ? 'Internal server error'
            : (error.message || 'Request failed');

    const payload = {
        code: httpStatus,
        message
    };

    if (!isProd) {
        payload.debug = {
            code: error.code,
            sqlState: error.sqlState,
            errno: error.errno
        };
    }

    return response.status(httpStatus).json(payload);
};