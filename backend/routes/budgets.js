const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const { serverError, badRequest, isPositiveAmount } = require('../lib/http');

router.use(authenticate);

// GET /api/budgets?month=&year= — budgets with the amount spent so far
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = `
      SELECT b.*,
             c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
             COALESCE((SELECT SUM(t.amount) FROM transactions t
                       WHERE t.category_id = b.category_id AND t.company_id = b.company_id
                         AND t.type = 'expense'
                         AND EXTRACT(MONTH FROM t.date) = b.month
                         AND EXTRACT(YEAR FROM t.date) = b.year), 0) AS spent
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      WHERE b.company_id = $1`;
    const params = [req.user.companyId];
    if (month) { params.push(month); query += ` AND b.month = $${params.length}`; }
    if (year)  { params.push(year);  query += ` AND b.year = $${params.length}`; }
    query += ' ORDER BY c.name';
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/budgets — set (or replace) the limit for a category and month; Owner or Admin
router.post('/', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { amount, month, year, categoryId } = req.body;
    if (!isPositiveAmount(amount)) return badRequest(res, 'Budget amount must be a positive number.');
    if (!(month >= 1 && month <= 12) || !(year >= 2000 && year <= 2100)) return badRequest(res, 'Invalid month or year.');
    const cat = await pool.query('SELECT type FROM categories WHERE id = $1 AND company_id = $2',
      [categoryId, req.user.companyId]);
    if (!cat.rows.length) return badRequest(res, 'Category not found.');
    if (cat.rows[0].type !== 'expense') return badRequest(res, 'Budgets can only be set for expense categories.');

    const { rows } = await pool.query(
      `INSERT INTO budgets (amount, month, year, category_id, company_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (category_id, month, year, company_id)
       DO UPDATE SET amount = EXCLUDED.amount RETURNING *`,
      [amount, month, year, categoryId, req.user.companyId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
});

// PUT /api/budgets/:id — change the amount; Owner or Admin
router.put('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    if (!isPositiveAmount(req.body.amount)) return badRequest(res, 'Budget amount must be a positive number.');
    const { rows } = await pool.query(
      'UPDATE budgets SET amount = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
      [req.body.amount, req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Budget not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE /api/budgets/:id — Owner or Admin
router.delete('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Budget not found.' });
    res.json({ success: true, message: 'Budget deleted.' });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
