const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");

exports.createDhuwit = (request, response) => {
    const id_user = request.id_user
    const date_dhuwit = request.body.date_dhuwit
    const nominal = request.body.nominal
    const status = request.body.status
    const information = request.body.information

    let query = "INSERT INTO tr_dhuwit (id_user, date_dhuwit, nominal, status, information) VALUES (?, ?, ?, ?, ?)"
    db.pool.query(query, [id_user, date_dhuwit, nominal, status, information], (error, results) => {
        baseError.handleError(error, response)
        
        response.json({
            code: statusCode.success,
            message: "Hore penambahan data dhuwit Berhasil",
            data: results[0]
        });
    })
}

exports.getDataDhuwit = (request, response) => {
    const id_user = request.id_user

    let query = "SELECT id, id_user, date_dhuwit, nominal, status, information, created_at, updated_at FROM tr_dhuwit WHERE id_user = ? ORDER BY date_dhuwit ASC"
    db.pool.query(query, [id_user], (error, results) => {
    
        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data dengan id user "+ id_user +" tidak ditemukan"
            });
        }
        
        response.json({
            code: statusCode.success,
            message: "Berhasil mengambil data dhuwit",
            data: results
        });
    })
}

exports.updateDhuwit = (request, response) => {
    const id = request.body.id
    const date_dhuwit = request.body.date_dhuwit
    const nominal = request.body.nominal
    const status = request.body.status
    const information = request.body.information

    let query = "UPDATE tr_dhuwit SET date_dhuwit=?, nominal=?, status=?, information=? WHERE id = ? ORDER BY date_dhuwit"
    db.pool.query(query, [date_dhuwit, nominal, status, information, id], (error, results) => {
        baseError.handleError(error, response)
        
        response.json({
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
        baseError.handleError(error, response)

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data dhuwit tidak ditemukan"
            });
        }

        let queryDelete = "DELETE FROM tr_dhuwit WHERE id = ?"
        db.pool.query(queryDelete, [id], (error, results) => {
            baseError.handleError(error, response)
            
            response.json({
                code: statusCode.success,
                message: "Berhasil menghapus data dhuwit"
            });
        })
    })
}