const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");
const { parseDhuwitText } = require('../services/aiService');

exports.createFromText = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                message: "text is required"
            });
        }

        const parsed = await parseDhuwitText(text);

        return res.json({
            code: statusCode.success,
            message: "AI parsing success",
            data: parsed
        });

    } catch (err) {
        return res.status(statusCode.bad_request).json({
            code: statusCode.bad_request,
            message: "AI failed",
            error: err.message
        });
    }
};

exports.createDhuwit = (request, response) => {
    const id_user = request.id_user
    const date_dhuwit = request.body.date_dhuwit
    const nominal = request.body.nominal
    const status = request.body.status
    const information = request.body.information

    let query = "INSERT INTO tr_dhuwit (id_user, date_dhuwit, nominal, status, information) VALUES (?, ?, ?, ?, ?)"
    db.pool.query(query, [id_user, date_dhuwit, nominal, status, information], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        return response.json({
            code: statusCode.success,
            message: "Hore penambahan data dhuwit Berhasil",
            data: results[0]
        });
    })
}

exports.getDataDhuwit = (request, response) => {
    const id_user = request.id_user;
    const limit = request.body.limit;

    let query = `
        SELECT id, id_user, date_dhuwit, nominal, status, information, created_at, updated_at
        FROM tr_dhuwit
        WHERE id_user = ?
        ORDER BY date_dhuwit DESC
    `;

    let params = [id_user];

    if (limit !== undefined && limit !== null && limit !== "") {
        query += " LIMIT ?";
        params.push(parseInt(limit, 10));
    }

    db.pool.query(query, params, (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        return response.json({
            code: statusCode.success,
            message: "Berhasil mengambil data dhuwit",
            data: results
        });
    });
};

exports.updateDhuwit = (request, response) => {
    const id = request.body.id
    const date_dhuwit = request.body.date_dhuwit
    const nominal = request.body.nominal
    const status = request.body.status
    const information = request.body.information

    let query = "UPDATE tr_dhuwit SET date_dhuwit=?, nominal=?, status=?, information=? WHERE id = ? ORDER BY date_dhuwit"
    db.pool.query(query, [date_dhuwit, nominal, status, information, id], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        return response.json({
            code: statusCode.success,
            message: "Upate data dhuwit Berhasil",
            data: results[0]
        });
    })
}

exports.deleteDhuwit = (request, response) => {
    const id = request.body.id

    let querySelect = "SELECT * FROM tr_dhuwit WHERE id = ?"
    db.pool.query(querySelect, [id], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data dhuwit tidak ditemukan"
            });
        }

        let queryDelete = "DELETE FROM tr_dhuwit WHERE id = ?"
        db.pool.query(queryDelete, [id], (error, results) => {
            if (error) {
                return baseError.handleError(error, response);
            }

            return response.json({
                code: statusCode.success,
                message: "Berhasil menghapus data dhuwit"
            });
        })
    })
}