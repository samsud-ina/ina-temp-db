const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require("../middleware/error.js");

// Ubah status jadi "in" atau "out"
function getStatusKey(status) {
    if (status === 1) return "in";
    if (status === 2) return "out";
    return "unknown";
}

// Ubah hasil count menjadi object per status
function mapCountResultByStatus(rows) {
    const result = {};
    rows.forEach(row => {
        const key = getStatusKey(row.status);
        result[key] = {
            count: row.count,
            total: row.total
        };
    });
    return result;
}

// API untuk semua ringkasan dashboard
exports.getDashboardSummary = (request, response) => {
    const id_user = request.id_user;
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = request.body.date || today.toISOString().slice(0, 10); // format: "YYYY-MM-DD"

    const from = `${date} 00:00:00`;
    const to = `${date} 23:59:59`;

    const queries = [
        {
            name: 'total_count_amplop',
            query: `SELECT status, COUNT(status) AS count, SUM(nominal) AS total 
                    FROM tr_amplop 
                    WHERE id_user = ? 
                    GROUP BY status 
                    ORDER BY status ASC`,
            params: [id_user]
        },
        {
            name: 'total_count_dhuwit',
            query: `SELECT status, COUNT(status) AS count, SUM(nominal) AS total 
                    FROM tr_dhuwit 
                    WHERE id_user = ? 
                    GROUP BY status 
                    ORDER BY status ASC`,
            params: [id_user]
        },
        {
            name: 'total_spend_month',
            query: `SELECT SUM(nominal) AS total_spend_month 
                    FROM tr_dhuwit 
                    WHERE MONTH(date_dhuwit) = ? AND id_user = ? AND status = 2`,
            params: [month, id_user]
        },
        {
            name: 'total_spend_day',
            query: `SELECT SUM(nominal) AS total_spend_day 
                    FROM tr_dhuwit 
                    WHERE date_dhuwit BETWEEN ? AND ? AND id_user = ? AND status = 2`,
            params: [from, to, id_user]
        }
    ];

    const result = {};
    let completed = 0;

    queries.forEach(({ name, query, params }) => {
        db.pool.query(query, params, (error, results) => {
            if (error) {
                return baseError.handleError(error, response);
            }

            if (name === 'total_count_amplop' || name === 'total_count_dhuwit') {
                result[name] = (results.length === 0) ? {} : mapCountResultByStatus(results);
            } else {
                result[name] = results[0] && results[0][name] ? results[0][name] : 0;
            }

            completed++;
            if (completed === queries.length) {
                return response.json({
                    code: statusCode.success,
                    message: "Dashboard summary ditemukan",
                    data: result
                });
            }
        });
    });
};