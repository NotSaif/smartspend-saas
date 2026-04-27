const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/companies
// Admin → all companies | Owner/Employee → their own company only
router.get('/', async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      ({ rows } = await pool.query(`
        SELECT c.*,
          (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) AS user_count,
          (SELECT COUNT(*) FROM transactions t WHERE t.company_id = c.id) AS transaction_count,
          (SELECT SUM(t.amount) FROM transactions t WHERE t.company_id = c.id AND t.type='income')  AS total_income,
          (SELECT SUM(t.amount) FROM transactions t WHERE t.company_id = c.id AND t.type='expense') AS total_expenses
        FROM companies c ORDER BY c.created_at DESC`
      ));
    } else if (req.user.companyId) {
      ({ rows } = await pool.query(`
        SELECT c.*,
          (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) AS user_count,
          (SELECT COUNT(*) FROM transactions t WHERE t.company_id = c.id) AS transaction_count,
          (SELECT SUM(t.amount) FROM transactions t WHERE t.company_id = c.id AND t.type='income')  AS total_income,
          (SELECT SUM(t.amount) FROM transactions t WHERE t.company_id = c.id AND t.type='expense') AS total_expenses
        FROM companies c WHERE c.id = $1`, [req.user.companyId]
      ));
    } else {
      rows = [];
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/companies
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, industry, location } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Company name is required.' });
    const { rows } = await pool.query(
      'INSERT INTO companies (name, industry, location) VALUES ($1,$2,$3) RETURNING *',
      [name, industry || null, location || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/companies/:id
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { name, industry, location } = req.body;
    const { rows } = await pool.query(
      'UPDATE companies SET name=$1, industry=$2, location=$3 WHERE id=$4 RETURNING *',
      [name, industry || null, location || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Company not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/companies/:id  — cascade delete everything
router.delete('/:id', authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = req.params.id;

    // Delete in dependency order
    await client.query('DELETE FROM transactions WHERE company_id=$1', [id]);
    await client.query('DELETE FROM budgets      WHERE company_id=$1', [id]);
    await client.query('DELETE FROM categories   WHERE company_id=$1', [id]);
    await client.query('UPDATE users SET company_id=NULL WHERE company_id=$1', [id]);
    const { rows } = await client.query('DELETE FROM companies WHERE id=$1 RETURNING id', [id]);

    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Company not found.' });
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Company and all related data deleted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
