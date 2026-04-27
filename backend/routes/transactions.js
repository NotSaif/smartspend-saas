const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/transactions — list with filters
router.get('/', async (req, res) => {
  try {
    const { type, categoryId, paymentMethod, startDate, endDate, search } = req.query;
    const companyId = req.user.companyId;

    let query = `
      SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE ($1::int IS NULL OR t.company_id = $1)
    `;
    const params = [companyId];
    let i = 2;

    if (type)           { query += ` AND t.type = $${i++}`;               params.push(type); }
    if (categoryId)     { query += ` AND t.category_id = $${i++}`;         params.push(categoryId); }
    if (paymentMethod)  { query += ` AND t.payment_method = $${i++}`;      params.push(paymentMethod); }
    if (startDate)      { query += ` AND t.date >= $${i++}`;               params.push(startDate); }
    if (endDate)        { query += ` AND t.date <= $${i++}`;               params.push(endDate); }
    if (search)         { query += ` AND t.description ILIKE $${i++}`;     params.push(`%${search}%`); }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1 AND t.company_id = $2`,
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Transaction not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { amount, date, type, description, paymentMethod, categoryId, receiptUrl } = req.body;
    if (!amount || !date || !type || !description || !paymentMethod)
      return res.status(400).json({ success: false, error: 'Missing required fields.' });

    const { rows } = await pool.query(
      `INSERT INTO transactions (amount, date, type, description, payment_method, category_id, company_id, user_id, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [amount, date, type, description, paymentMethod, categoryId || null,
       req.user.companyId, req.user.id, receiptUrl || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const { amount, date, type, description, paymentMethod, categoryId, receiptUrl } = req.body;
    const { rows } = await pool.query(
      `UPDATE transactions SET
         amount=$1, date=$2, type=$3, description=$4, payment_method=$5,
         category_id=$6, receipt_url=$7, updated_at=NOW()
       WHERE id=$8 AND company_id=$9 RETURNING *`,
      [amount, date, type, description, paymentMethod, categoryId || null,
       receiptUrl || null, req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Transaction not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM transactions WHERE id=$1 AND company_id=$2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Transaction not found.' });
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
