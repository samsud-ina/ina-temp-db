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

exports.getTotalCountAmplop = (request, response) => {
    const id_user = request.id_user

    let query = "SELECT `tr_amplop`.`id_user` AS `id_user`, `tr_amplop`.`status` AS `status`, count(`tr_amplop`.`status`) AS `count`, sum(`tr_amplop`.`nominal`) AS `total` FROM `tr_amplop` GROUP BY `tr_amplop`.`id_user`, `tr_amplop`.`status` ORDER BY `tr_amplop`.`id_user` ASC, `tr_amplop`.`status` ASC"
    db.pool.query(query, [id_user], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data total count amplop tidak ditemukan"
            });
        }
        
        return response.json({
            code: statusCode.success,
            message: "Total count amplop ditemukan",
            data: results
        });
    })
}

exports.getTotalCountDhuwit = (request, response) => {
    const id_user = request.id_user

    let query = "SELECT `tr_dhuwit`.`id_user` AS `id_user`, `tr_dhuwit`.`status` AS `status`, count(`tr_dhuwit`.`status`) AS `count`, sum(`tr_dhuwit`.`nominal`) AS `total` FROM `tr_dhuwit` GROUP BY `tr_dhuwit`.`id_user`, `tr_dhuwit`.`status` ORDER BY `tr_dhuwit`.`id_user` ASC, `tr_dhuwit`.`status` ASC"
    db.pool.query(query, [id_user], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data total count dhuwit tidak ditemukan"
            });
        }
        
        return response.json({
            code: statusCode.success,
            message: "Total count dhuwit ditemukan",
            data: results
        });
    })
}

exports.getTotalSpendDhuwitMonth = (request, response) => {
    const id_user = request.id_user
    const today = new Date()
    const month = today.getMonth() + 1

    let query = "SELECT SUM(tr_dhuwit.nominal) AS `total_spend_month` FROM tr_dhuwit WHERE MONTH(tr_dhuwit.date_dhuwit) = ? AND id_user = ? AND status = 2"
    db.pool.query(query, [month ,id_user], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data total dhuwit bulan ini tidak ditemukan"
            });
        }
        
        return response.json({
            code: statusCode.success,
            message: "Total dhuwit bulan ini ditemukan",
            data: results[0]
        });
    })
}

exports.getTotalSpendDhuwitDay = (request, response) => {
    const id_user = request.id_user
    const date = request.body.date

    const from = date + " 00:00:00"
    const to = date + " 23:59:59"

    let query = "SELECT SUM(tr_dhuwit.nominal) AS `total_spend_day` FROM tr_dhuwit WHERE tr_dhuwit.date_dhuwit BETWEEN ? AND ? AND id_user = ? AND status = 2"
    db.pool.query(query, [from, to ,id_user], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Data total dhuwit hari ini tidak ditemukan"
            });
        }
        
        return response.json({
            code: statusCode.success,
            message: "Total dhuwit hari ini ditemukan",
            data: results[0]
        });
    })
}