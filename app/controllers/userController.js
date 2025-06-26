const db = require('../config/dbConfig.js');
const bcrypt = require("bcryptjs");
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");

exports.getUsers = (request, response) => {
    db.pool.query("SELECT * FROM user_apps", (error, results) => {
        baseError.handleError(error, response)
        
        response.json({
            code: statusCode.success,
            message: "Berhasil mengambil data semua user",
            data: results
        });
    })
}

exports.getUserById = (request, response) => {
    const id = request.id_user

    let query = "SELECT * FROM user_apps WHERE id = ?"
    db.pool.query(query, [id], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }
        
        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "User tidak ditemukan dengan id : " + id
            });
        }
        
        return response.json({
            code: statusCode.success,
            message: "Detail user ditemukan dengan id : "+ results[0].id +" dan nama : " + results[0].name,
            data: results[0]
        });
    })
}

exports.updateProfile = (request, response) => {
    const id = request.id_user
    const name = request.body.name
    const email = request.body.email
    const password = request.body.password

    var bcrypPassword = bcrypt.hashSync(password, 8)
    
    let query = "UPDATE user_apps SET name = ?, email = ?, password = ? WHERE id = ?"
    db.pool.query(query, [name, email, bcrypPassword, id], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }
        
        return response.json({
            code: statusCode.success,
            message: "Update profile Berhasil",
            data: results
        });
    })
}

exports.deleteUser = (request, response) => {
    const id = request.id_user

    let querySelect = "SELECT * FROM user_apps WHERE id = ?"
    db.pool.query(querySelect, [id], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "User tidak ditemukan"
            });
        }

        let queryDelete = "DELETE FROM user_apps WHERE id = ?"
        db.pool.query(queryDelete, [id], (error, results) => {
            if (error) {
                return baseError.handleError(error, response);
            }
            
            return response.json({
                code: statusCode.success,
                message: "Berhasil menghapus data user dengan id : "+ id
            });
        })
    })
}