const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");

exports.getItems = (request, response) => {
    db.pool.query("SELECT * FROM m_item", (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }
        
        return response.json({
            code: statusCode.success,
            message: "Berhasil mengambil data semua item",
            data: results
        });
    })
}

exports.addItem = (request, response) => {
    const name = request.body.name
    
    let querySelect = "SELECT * FROM m_item WHERE LOWER(name_item) = ?"
    db.pool.query(querySelect, [name.toLowerCase()], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length != 0) {
            return response.json({
                code: statusCode.already_exists,
                message: "Nama item sudah ada"
            });
        }

        let queryInsert = "INSERT INTO m_item (name_item) VALUES (?)"
        db.pool.query(queryInsert, [name], (error, results) => {
            if (error) {
                return baseError.handleError(error, response);
            }
            
            return response.json({
                code: statusCode.success,
                message: "Penambahan item Berhasil",
                data: results[0]
            });
        })
    })
}

exports.deleteItem = (request, response) => {
    const name = request.body.name

    let querySelect = "SELECT * FROM m_item WHERE name_item = ?"
    db.pool.query(querySelect, [name], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
             return response.json({
                code: statusCode.empty_data,
                message: "Item tidak ditemukan"
            });
        }

        let queryDelete = "DELETE FROM m_item WHERE name_item = ?"
        db.pool.query(queryDelete, [name], (error, results) => {
            if (error) {
                return baseError.handleError(error, response);
            }
            
            return response.json({
                code: statusCode.success,
                message: "Berhasil menghapus item dengan nama : " + name
            });
        })
    })
}