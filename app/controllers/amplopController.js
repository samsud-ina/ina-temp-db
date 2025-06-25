const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");

exports.getDataAmplop = (request, response) => {
    const id_user = request.id_user

    let query = "SELECT a.id, a.id_user, a.id_item, b.name_item, a.name, a.origin, a.date_ngamplop, a.nominal, a.status, a.information, a.created_at, a.updated_at  FROM tr_amplop a LEFT JOIN m_item b ON a.id_item = b.id WHERE id_user = ? ORDER BY a.date_ngamplop"
    db.pool.query(query, [id_user], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (!results || results.length === 0) {
            return response.json({
                code: statusCode.empty_data,
                message: 'Data tidak ditemukan'
            });
        }

        return response.json({
            code: statusCode.success,
            message: "Berhasil mengambil data amplop",
            data: results
        });
    })
}

exports.getDetailAmplop = (request, response) => {
    const id = request.body.id

    let query = "SELECT a.id, a.id_user, a.id_item, b.name_item, a.name, a.origin, a.date_ngamplop, a.nominal, a.status, a.information, a.created_at, a.updated_at  FROM tr_amplop a LEFT JOIN m_item b ON a.id_item = b.id WHERE a.id = ?"
    db.pool.query(query, [id], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data detail amplop tidak ditemukan"
            });
        }

        return response.json({
            code: statusCode.success,
            message: "Berhasil mengambil data detail amplop",
            data: results[0]
        });
    })
}

exports.createAmplop = (request, response) => {
    const id_user = request.id_user
    const id_item = request.body.id_item
    const name = request.body.name
    const origin = request.body.origin
    const date_ngamplop = request.body.date_ngamplop
    const nominal = request.body.nominal
    const status = request.body.status
    const information = request.body.information

    let query = "INSERT INTO tr_amplop (id_user, id_item, name, origin, date_ngamplop, nominal, status, information) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    db.pool.query(query, [id_user, id_item, name, origin, date_ngamplop, nominal, status, information], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }
        
        return response.json({
            code: statusCode.success,
            message: "Hore penambahan data amplop Berhasil",
            data: results[0]
        });
    })
}

exports.updateAmplop = (request, response) => {
    const id = request.body.id
    const id_item = request.body.id_item
    const name = request.body.name
    const origin = request.body.origin
    const date_ngamplop = request.body.date_ngamplop
    const nominal = request.body.nominal
    const status = request.body.status
    const information = request.body.information

    let query = "UPDATE tr_amplop SET id_item=?, name=?, origin=?, date_ngamplop=?, nominal=?, status=?, information=? WHERE id = ?"
    db.pool.query(query, [id_item, name, origin, date_ngamplop, nominal, status, information, id], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }
        
        return response.json({
            code: statusCode.success,
            message: "Upate data amplop Berhasil",
            data: results[0]
        });
    })
}

exports.deleteAmplop = (request, response) => {
    const id = request.body.id

    let querySelect = "SELECT * FROM tr_amplop WHERE id = ?"
    db.pool.query(querySelect, [id], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data ngamplop tidak ditemukan"
            });
        }

        let queryDelete = "DELETE FROM tr_amplop WHERE id = ?"
        db.pool.query(queryDelete, [id], (error, results) => {
            if (error) {
                return baseError.handleError(error, response);
            }
            
            return response.json({
                code: statusCode.success,
                message: "Berhasil menghapus data amplop"
            });
        })
    })
}