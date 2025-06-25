const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");

exports.getVersion = (request, response) => {
    const reqVersionSplit = request.body.version.split(".");

    db.pool.query("SELECT * FROM m_version ORDER BY created_at DESC", (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        var updateApps = false
        var message = "Aplikasi sudah version terbaru"

        let version = results[0].android_version;
        let versionSplit = version.split(".");
        for (const index in versionSplit) { 
            let reqVersion = parseInt(reqVersionSplit[index])
            let version = parseInt(versionSplit[index])
            if (reqVersion < version) {
                updateApps = true
                message = "Update Aplikasi di Playstore"
            }
        }

        let  data = {
            new_version_apps: version,
            update_apps: updateApps,
            force_update: results[0].is_force_update
        };
        return response.json({
            code: statusCode.success,
            message: message,
            data: data
        });
    })
}