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

exports.getDashboardSummary = async (request, response) => {
    try {
        const id_user = request.id_user;

        const today = new Date();
        const date = request.body.date || today.toISOString().slice(0, 10);

        // Day range
        const startDay = `${date} 00:00:00`;

        const nextDayObj = new Date(date);
        nextDayObj.setDate(nextDayObj.getDate() + 1);

        const endDay = `${nextDayObj.toISOString().slice(0, 10)} 00:00:00`;

        // Month range
        const selectedDate = new Date(date);

        const startMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        );

        const nextMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            1
        );

        const startMonthStr = `${startMonth.toISOString().slice(0, 10)} 00:00:00`;
        const nextMonthStr = `${nextMonth.toISOString().slice(0, 10)} 00:00:00`;

        const amplopQuery = `
            SELECT
                status,
                COUNT(*) AS count,
                COALESCE(SUM(nominal), 0) AS total
            FROM tr_amplop
            WHERE id_user = ?
            GROUP BY status
            ORDER BY status ASC
        `;

        const dhuwitQuery = `
            SELECT
                status,
                COUNT(*) AS count,
                COALESCE(SUM(nominal), 0) AS total,

                SUM(
                    CASE
                        WHEN status = 2
                        AND date_dhuwit >= ?
                        AND date_dhuwit < ?
                        THEN nominal
                        ELSE 0
                    END
                ) AS total_spend_day,

                SUM(
                    CASE
                        WHEN status = 2
                        AND date_dhuwit >= ?
                        AND date_dhuwit < ?
                        THEN nominal
                        ELSE 0
                    END
                ) AS total_spend_month,

                SUM(
                    CASE
                        WHEN status = 1
                        AND date_dhuwit >= ?
                        AND date_dhuwit < ?
                        THEN nominal
                        ELSE 0
                    END
                ) AS total_income_day,

                SUM(
                    CASE
                        WHEN status = 1
                        AND date_dhuwit >= ?
                        AND date_dhuwit < ?
                        THEN nominal
                        ELSE 0
                    END
                ) AS total_income_month

            FROM tr_dhuwit
            WHERE id_user = ?
            GROUP BY status
            ORDER BY status ASC
        `;

        const [
            [amplopResults],
            [dhuwitResults]
        ] = await Promise.all([
            db.pool.promise().query(amplopQuery, [id_user]),
            db.pool.promise().query(dhuwitQuery, [
                startDay,
                endDay,

                startMonthStr,
                nextMonthStr,

                startDay,
                endDay,

                startMonthStr,
                nextMonthStr,

                id_user
            ])
        ]);

        const result = {
            total_count_amplop:
                amplopResults.length === 0
                    ? {}
                    : mapCountResultByStatus(amplopResults),

            total_count_dhuwit:
                dhuwitResults.length === 0
                    ? {}
                    : mapCountResultByStatus(dhuwitResults),

            total_spend_day: 0,
            total_spend_month: 0
        };

        const spendData = dhuwitResults.find(
            item => Number(item.status) === 2
        );

        if (spendData) {
            result.total_spend_day = Number(
                spendData.total_spend_day || 0
            );

            result.total_spend_month = Number(
                spendData.total_spend_month || 0
            );
        }

        const incomeData = dhuwitResults.find(
            item => Number(item.status) === 1
        );

        if (incomeData) {
            result.total_income_day = Number(
                incomeData.total_income_day || 0
            );

            result.total_income_month = Number(
                incomeData.total_income_month || 0
            );
        }

        return response.json({
            code: statusCode.success,
            message: "Dashboard summary ditemukan",
            data: result
        });

    } catch (error) {
        return baseError.handleError(error, response);
    }
};

exports.getDhuwitSummary = async (request, response) => {
    try {
        const id_user = request.id_user;

        const today = new Date();

        const month = Number(request.body.month) || (today.getMonth() + 1);
        const year = Number(request.body.year) || today.getFullYear();

        if (month < 1 || month > 12) {
            return response.json({
                code: statusCode.failed,
                message: "Bulan tidak valid"
            });
        }

        const startMonth = new Date(year, month - 1, 1);
        const nextMonth = new Date(year, month, 1);

        const startMonthStr = `${startMonth.toISOString().slice(0, 10)} 00:00:00`;
        const nextMonthStr = `${nextMonth.toISOString().slice(0, 10)} 00:00:00`;

        const query = `
            SELECT
                status,
                COUNT(*) AS total_count,
                COALESCE(SUM(nominal), 0) AS total_nominal
            FROM tr_dhuwit
            WHERE
                id_user = ?
                AND date_dhuwit >= ?
                AND date_dhuwit < ?
            GROUP BY status
            ORDER BY status ASC
        `;

        const [rows] = await db.pool.promise().query(query, [
            id_user,
            startMonthStr,
            nextMonthStr
        ]);

        const income = rows.find(item => Number(item.status) === 1);
        const spend = rows.find(item => Number(item.status) === 2);

        const totalIncome = Number(income?.total_nominal || 0);
        const totalSpend = Number(spend?.total_nominal || 0);

        return response.json({
            code: statusCode.success,
            message: "Summary dhuwit ditemukan",
            data: {
                month,
                year,
                total_income: totalIncome,
                total_spend: totalSpend,
                balance: totalIncome - totalSpend,
                income_count: Number(income?.total_count || 0),
                spend_count: Number(spend?.total_count || 0)
            }
        });

    } catch (error) {
        return baseError.handleError(error, response);
    }
};