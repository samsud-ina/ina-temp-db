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

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

exports.addTransaction = async (request, response) => {
  try {
    const body = request.body || {};
    const clientReff = String(body.clientReff || '').trim();
    const userId = String(body.userId || '').trim();
    const nmid = String(body.nmid || '').trim();
    const merchantName = String(body.merchantName || '').trim();
    const customerName = String(body.customerName || '').trim();

    if (!clientReff || !userId) {
      return response.json({
        code: statusCode.bad_request,
        message: 'clientReff and userId are required'
      });
    }

    const duplicated = await query(
      'SELECT id FROM transactions WHERE client_reff = ? AND user_id = ? LIMIT 1',
      [clientReff, userId]
    );

    if (duplicated.length) {
      return response.json({
        code: statusCode.already_exists,
        message: 'Transaction already exists'
      });
    }

    const items = Array.isArray(body.items) ? body.items : [];

    let totalAmount = 0;
    const normalizedItems = [];

    if (items.length > 0) {
      for (const item of items) {
        const price = toInt(item.price, 0);
        const qty = toInt(item.qty, 0);
        const subtotal = price * qty;

        if (price < 0 || qty <= 0) {
          return response.json({
            code: statusCode.bad_request,
            message: 'Invalid item price or qty'
          });
        }

        totalAmount += subtotal;
        normalizedItems.push({
          productId: item.productId,
          productName: item.productName,
          price,
          qty,
          subtotal
        });
      }
    } else {
      totalAmount = toInt(body.totalAmount, 0);
    }

    if (totalAmount <= 0) {
      return response.json({
        code: statusCode.bad_request,
        message: 'Total amount is required'
      });
    }

    const ppnPercentage = Number(body.ppnPercentage || 0);
    const servicePercentage = Number(body.servicePercentage || 0);
    const grandTotal = toInt(body.grandTotal, totalAmount);

    const insertTransaction = await query(
      `
      INSERT INTO transactions
      (client_reff, nmid, merchant_name, user_id, customer_name, total_amount, ppn_percentage, service_percentage, grand_total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        clientReff,
        nmid,
        merchantName,
        userId,
        customerName,
        totalAmount,
        ppnPercentage,
        servicePercentage,
        grandTotal,
        'PENDING'
      ]
    );

    const transactionId = insertTransaction.insertId;

    for (const item of normalizedItems) {
      await query(
        `
        INSERT INTO transaction_items
        (transaction_id, product_id, product_name, price, qty, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          transactionId,
          item.productId,
          item.productName,
          item.price,
          item.qty,
          item.subtotal
        ]
      );
    }

    return response.json({
      code: statusCode.success,
      message: 'Transaction created',
      data: {
        transactionId,
        totalAmount
      }
    });
  } catch (error) {
    return baseError.handleError(error, response);
  }
};

exports.updateTransactionStatus = async (request, response) => {
  try {
    const body = request.body || {};
    const clientReff = String(body.clientReff || '').trim();
    const userId = String(body.userId || '').trim();
    const paymentStatus = String(body.paymentStatus || '').trim();

    if (!clientReff || !userId || !paymentStatus) {
      return response.json({
        code: statusCode.bad_request,
        message: 'clientReff, userId, and paymentStatus are required'
      });
    }

    const rows = await query(
      'SELECT id FROM transactions WHERE client_reff = ? AND user_id = ? LIMIT 1',
      [clientReff, userId]
    );

    if (!rows.length) {
      return response.json({
        code: statusCode.empty_data,
        message: 'Transaction not found'
      });
    }

    await query(
      `
      UPDATE transactions
      SET
        status = ?,
        paid_at = NOW(),
        updated_at = NOW()
      WHERE id = ? AND user_id = ?
      `,
      [paymentStatus, rows[0].id, userId]
    );

    return response.json({
      code: statusCode.success,
      message: 'Transaction updated'
    });
  } catch (error) {
    return baseError.handleError(error, response);
  }
};

exports.getTransaction = async (request, response) => {
  try {
    const userId = String(request.query.userId || '').trim();
    const clientReff = String(request.query.clientReff || '').trim();

    if (!userId) {
      return response.json({
        code: statusCode.bad_request,
        message: 'userId is required'
      });
    }

    if (!clientReff) {
      return response.json({
        code: statusCode.bad_request,
        message: 'clientReff is required'
      });
    }

    const transactions = await query(
      `
      SELECT
        id,
        client_reff AS clientReff,
        nmid,
        merchant_name AS merchantName,
        user_id AS userId,
        customer_name AS customerName,
        total_amount AS totalAmount,
        ppn_percentage AS ppnPercentage,
        service_percentage AS servicePercentage,
        grand_total AS grandTotal,
        status AS paymentStatus,
        created_at AS createdAt,
        paid_at AS paidAt
      FROM transactions
      WHERE user_id = ? AND client_reff = ?
      LIMIT 1
      `,
      [userId, clientReff]
    );

    if (!transactions.length) {
      return response.json({
        code: statusCode.empty_data,
        message: 'Transaction not found'
      });
    }

    const transaction = transactions[0];

    const items = await query(
      `
      SELECT
        product_id AS productId,
        product_name AS productName,
        price,
        qty,
        subtotal
      FROM transaction_items
      WHERE transaction_id = ?
      ORDER BY id ASC
      `,
      [transaction.id]
    );

    return response.json({
      code: statusCode.success,
      message: 'Success get transaction',
      data: {
        ...transaction,
        items
      }
    });
  } catch (error) {
    return baseError.handleError(error, response);
  }
};