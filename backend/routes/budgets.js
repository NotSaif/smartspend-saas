const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/budgets — with spending calculation
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const companyId = req.user.companyId;

    let query = `
      SELECT b.*,
             c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
             COALESCE(
               (SELECT SUM(t.amount) FROM transactions t
                WHERE t.category_id = b.category_id
                  AND t.company_id = b.company_id
                  AND t.type = 'expense'
                  AND EXTRACT(MONTH FROM t.date) = b.month
                  AND EXTRACT(YEAR FROM t.date) = b.year),
               0
             ) AS spent
      FROM budgets b
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE ($1::int IS NULL OR b.company_id = $1)
    `;
    const params = [companyId];
    let i = 2;
    if (month) { query += ` AND b.month = $${i++}`; params.push(month); }
    if (year)  { query += ` AND b.year  = $${i++}`; params.push(year);  }
    query += ' ORDER BY c.name';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/budgets
router.post('/', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { amount, month, year, categoryId } = req.body;
    if (!amount || !month || !year || !categoryId)
      return res.status(400).json({ success: false, error: 'Missing required fields.' });

    const { rows } = await pool.query(
      `INSERT INTO budgets (amount, month, year, category_id, company_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (category_id, month, year, company_id)
       DO UPDATE SET amount = EXCLUDED.amount RETURNING *`,
      [amount, month, year, categoryId, req.user.companyId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/budgets/:id
router.put('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { amount } = req.body;
    const { rows } = await pool.query(
      'UPDATE budgets SET amount=$1 WHERE id=$2 AND company_id=$3 RETURNING *',
      [amount, req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Budget not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM budgets WHERE id=$1 AND company_id=$2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Budget not found.' });
    res.json({ success: true, message: 'Budget deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
