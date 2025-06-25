const db = require('../config/dbConfig.js');
const authConfig = require("../config/authConfig.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");

exports.login = (request, response) => {
    const email = request.body.email
    const password = request.body.password

    let query = "SELECT * FROM user_apps WHERE email = ?"
    db.pool.query(query, [email], (error, results) => {
        baseError.handleError(error, response)

        if (results.length == 0) {
            return response.json({
                code: statusCode.empty_data,
                message: "Akun tidak ditemukan"
            });
        }

        let passwordIsValid = bcrypt.compareSync(
            password,
            results[0].password
        );
        if (passwordIsValid) {
            let token = jwt.sign({ id: results[0].id }, authConfig.secret, {
                expiresIn: 31536000 // 1 year
            });
            response.json({
                code: statusCode.success,
                message: "Login Berhasil",
                data: results[0],
                session: token
            });
        } else {
            response.json({
                code: statusCode.wrong_password,
                message: "Kata sandi salah"
            });
        }
    })
}

exports.register = (request, response) => {
    const name = request.body.name
    const email = request.body.email
    const password = request.body.password

    let querySelect = "SELECT * FROM user_apps WHERE email = ?"
    db.pool.query(querySelect, [email], (error, results) => {
        if (error) {
            return baseError.handleError(error, response);
        }

        if (results.length != 0) {
            return response.json({
                code: statusCode.already_exists,
                message: "Email sudah pernah digunakan"
            });
        }
        
        let bcrypPassword = bcrypt.hashSync(password, 8)

        let queryInsert = "INSERT INTO user_apps (name, email, password) VALUES (?, ?, ?)"
        db.pool.query(queryInsert, [name, email, bcrypPassword], (error, results) => {
            if (error) {
                return baseError.handleError(error, response);
            }
            
            return response.json({
                code: statusCode.success,
                message: "Pendaftaran Berhasil",
                data: results
            });
        })
    })
}