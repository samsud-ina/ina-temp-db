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

function toBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

exports.getTaxService = async (request, response) => {
  try {
    const userId = request.query.userId;

    if (!userId) {
      return response.json({
        code: statusCode.bad_request,
        message: 'userId is required'
      });
    }

    const results = await query(
      `
      SELECT
        id,
        user_id AS userId,
        type,
        name,
        percentage,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM tax_services
      WHERE user_id = ?
      ORDER BY id ASC
      `,
      [userId]
    );

    return response.json({
      code: statusCode.success,
      message: 'Success get tax service',
      data: results
    });
  } catch (error) {
    return baseError.handleError(error, response);
  }
};

exports.saveTaxServices = async (request, response) => {
  try {
    const userId = request.body.userId;
    const items = request.body.items;

    if (!userId) {
      return response.json({
        code: statusCode.bad_request,
        message: 'userId is required'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return response.json({
        code: statusCode.bad_request,
        message: 'items is required'
      });
    }

    const normalizedItems = items.map((item) => ({
      type: String(item.type || '').trim(),
      name: String(item.name || '').trim(),
      percentage: Number(item.percentage),
      isActive: toBoolean(item.isActive, true)
    }));

    const types = normalizedItems.map((item) => item.type);
    const uniqueTypes = new Set(types);
    if (uniqueTypes.size !== types.length) {
      return response.json({
        code: statusCode.bad_request,
        message: 'Duplicate tax service type'
      });
    }

    for (const item of normalizedItems) {
      if (!['tax', 'service_charge'].includes(item.type)) {
        return response.json({
          code: statusCode.bad_request,
          message: `Invalid type: ${item.type}`
        });
      }

      if (!item.name) {
        return response.json({
          code: statusCode.bad_request,
          message: `Name is required for ${item.type}`
        });
      }

      if (!Number.isFinite(item.percentage) || item.percentage < 1 || item.percentage > 100) {
        return response.json({
          code: statusCode.bad_request,
          message: `Percentage must be between 1 and 100 for ${item.type}`
        });
      }
    }

    const existingRows = await query(
      'SELECT id, type, created_at FROM tax_services WHERE user_id = ?',
      [userId]
    );

    const existingByType = new Map(
      existingRows.map((row) => [String(row.type), row])
    );

    const result = [];

    for (const item of normalizedItems) {
      const existing = existingByType.get(item.type);

      if (existing) {
        await query(
          `
          UPDATE tax_services
          SET
            name = ?,
            percentage = ?,
            is_active = ?,
            updated_at = NOW()
          WHERE id = ? AND user_id = ?
          `,
          [item.name, item.percentage, item.isActive, existing.id, userId]
        );

        result.push({
          id: existing.id,
          userId,
          type: item.type,
          name: item.name,
          percentage: item.percentage,
          isActive: item.isActive,
          action: 'updated'
        });
      } else {
        const insertResult = await query(
          `
          INSERT INTO tax_services
          (user_id, type, name, percentage, is_active)
          VALUES (?, ?, ?, ?, ?)
          `,
          [userId, item.type, item.name, item.percentage, item.isActive]
        );

        result.push({
          id: insertResult.insertId,
          userId,
          type: item.type,
          name: item.name,
          percentage: item.percentage,
          isActive: item.isActive,
          action: 'created'
        });
      }
    }

    return response.json({
      code: statusCode.success,
      message: 'Tax services saved',
      data: result
    });
  } catch (error) {
    return baseError.handleError(error, response);
  }
};