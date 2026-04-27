const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('owner', 'admin'));

// GET /api/reports/monthly?year=2026
router.get('/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const companyId = req.user.companyId;

    const { rows } = await pool.query(`
      SELECT
        EXTRACT(MONTH FROM date)::int AS month,
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses,
        SUM(CASE WHEN type='income'  THEN amount ELSE -amount END) AS net,
        COUNT(*) AS transaction_count
      FROM transactions
      WHERE company_id=$1 AND EXTRACT(YEAR FROM date)=$2
      GROUP BY month
      ORDER BY month`,
      [companyId, year]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/by-category?year=2026&month=4
router.get('/by-category', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    const companyId = req.user.companyId;

    let query = `
      SELECT c.id, c.name, c.type, c.color, c.icon,
             SUM(t.amount) AS total, COUNT(t.id) AS count
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.company_id=$1 AND EXTRACT(YEAR FROM t.date)=$2
    `;
    const params = [companyId, year];
    if (month) { query += ` AND EXTRACT(MONTH FROM t.date)=$3`; params.push(month); }
    query += ' GROUP BY c.id, c.name, c.type, c.color, c.icon ORDER BY total DESC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/summary?month=4&year=2026
router.get('/summary', async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const companyId = req.user.companyId;

    const [txResult, budgetResult] = await Promise.all([
      pool.query(`
        SELECT
          SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses,
          COUNT(*) AS transaction_count
        FROM transactions
        WHERE company_id=$1 AND EXTRACT(MONTH FROM date)=$2 AND EXTRACT(YEAR FROM date)=$3`,
        [companyId, month, year]
      ),
      pool.query(`
        SELECT SUM(b.amount) AS total_budget,
               SUM(COALESCE(
                 (SELECT SUM(t.amount) FROM transactions t
                  WHERE t.category_id=b.category_id AND t.type='expense'
                  AND EXTRACT(MONTH FROM t.date)=$2 AND EXTRACT(YEAR FROM t.date)=$3),
                 0
               )) AS total_spent
        FROM budgets b WHERE b.company_id=$1 AND b.month=$2 AND b.year=$3`,
        [companyId, month, year]
      ),
    ]);

    const tx = txResult.rows[0];
    const bud = budgetResult.rows[0];
    res.json({
      success: true,
      data: {
        income: parseFloat(tx.income) || 0,
        expenses: parseFloat(tx.expenses) || 0,
        net: (parseFloat(tx.income) || 0) - (parseFloat(tx.expenses) || 0),
        transactionCount: parseInt(tx.transaction_count),
        totalBudget: parseFloat(bud.total_budget) || 0,
        totalSpent: parseFloat(bud.total_spent) || 0,
        budgetUtilization: bud.total_budget > 0
          ? Math.round((bud.total_spent / bud.total_budget) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
