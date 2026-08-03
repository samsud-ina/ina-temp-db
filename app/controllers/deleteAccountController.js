const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require('../middleware/error.js');

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.pool.query(sql, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      return resolve(results);
    });
  });
}

exports.getDeleteAccount = async (request, response) => {
  try {
    const email = String(request.query.email || '').trim().toLowerCase();

    if (!email) {
      return response.json({
        code: statusCode.bad_request,
        message: 'Email is required'
      });
    }

    const rows = await query(
      `
      SELECT
        id AS no,
        account_id AS id,
        name,
        email
      FROM delete_accounts
      WHERE LOWER(email) = ?
      LIMIT 1
      `,
      [email]
    );

    if (!rows.length) {
      return response.json({
        code: statusCode.empty_data,
        message: 'Data not found'
      });
    }

    return response.json({
      code: statusCode.success,
      message: 'Success get delete account',
      data: rows[0]
    });
  } catch (error) {
    return baseError.handleError(error, response);
  }
};

exports.addDeleteAccount = async (request, response) => {
  try {
    const accountId = String(request.body.id || '').trim();
    const name = String(request.body.name || '').trim();
    const email = String(request.body.email || '').trim().toLowerCase();

    if (!accountId || !name || !email) {
      return response.json({
        code: statusCode.bad_request,
        message: 'id, name, and email are required'
      });
    }

    const duplicatedId = await query(
      'SELECT id FROM delete_accounts WHERE account_id = ? LIMIT 1',
      [accountId]
    );

    if (duplicatedId.length) {
      return response.json({
        code: statusCode.already_exists,
        message: 'ID already exists'
      });
    }

    const duplicatedEmail = await query(
      'SELECT id FROM delete_accounts WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );

    if (duplicatedEmail.length) {
      return response.json({
        code: statusCode.already_exists,
        message: 'Email already exists'
      });
    }

    await query(
      `
      INSERT INTO delete_accounts
      (account_id, name, email)
      VALUES (?, ?, ?)
      `,
      [accountId, name, email]
    );

    return response.json({
      code: statusCode.success,
      message: 'Delete account request created'
    });
  } catch (error) {
    return baseError.handleError(error, response);
  }
};