const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");


function toBoolean(value) {
    return value === true || String(value).toUpperCase() === "TRUE" || Number(value) === 1;
}

exports.getVersion = (request, response) => {
    const platformInput = request.body?.platform || request.query?.platform || "";
    const versionCodeInput = request.body?.versionCode || request.query?.versionCode || "0";

    const platform = String(platformInput).trim().toLowerCase();
    const currentVersionCode = Number.parseInt(versionCodeInput, 10) || 0;

    if (!platform) {
        return response.json({
            code: statusCode.bad_request,
            message: "Platform is required"
        });
    }

    const query = `
        SELECT
            platform,
            version_code,
            version_name,
            force_update,
            show_update,
            download_url
        FROM app_version
        WHERE LOWER(platform) = ?
        ORDER BY version_code DESC
        LIMIT 1
    `;

    db.pool.query(query, [platform], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (!results || results.length === 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "App version not found"
            });
        }

        const latest = results[0];
        const latestVersionCode = Number(latest.version_code || 0);
        const latestVersionName = String(latest.version_name || "");
        const latestForceUpdate = toBoolean(latest.force_update);
        const latestShowUpdate = toBoolean(latest.show_update);
        const downloadUrl = String(latest.download_url || "");

        const needUpdate = currentVersionCode < latestVersionCode;
        const isLatest = !needUpdate;
        const showUpdate = needUpdate && (latestShowUpdate || latestForceUpdate);
        const forceUpdate = needUpdate && latestForceUpdate;

        return response.json({
            code: statusCode.success,
            message: "Success get app version",
            data: {
                platform,
                currentVersionCode,
                latestVersionCode,
                latestVersionName,
                isLatest,
                needUpdate,
                showUpdate,
                forceUpdate,
                downloadUrl
            }
        });
    });
};