const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const { detectAnomalies } = require('../lib/anomalies');
const { serverError, badRequest, isValidDate, isPositiveAmount } = require('../lib/http');

router.use(authenticate);

const TYPES = ['income', 'expense'];
const METHODS = ['cash', 'card', 'transfer'];

const SELECT = `
  SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id`;

// GET /api/transactions — list with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, categoryId, paymentMethod, startDate, endDate, minAmount, maxAmount, anomaly, search } = req.query;
    let query = `${SELECT} WHERE t.company_id = $1`;
    const params = [req.user.companyId];
    const add = (sql, value) => { params.push(value); query += ` AND ${sql.replace('?', `$${params.length}`)}`; };

    if (type)               add('t.type = ?', type);
    if (categoryId)         add('t.category_id = ?', categoryId);
    if (paymentMethod)      add('t.payment_method = ?', paymentMethod);
    if (isValidDate(startDate)) add('t.date >= ?', startDate);
    if (isValidDate(endDate))   add('t.date <= ?', endDate);
    if (minAmount)          add('t.amount >= ?', minAmount);
    if (maxAmount)          add('t.amount <= ?', maxAmount);
    if (anomaly === 'true') query += ' AND t.is_anomaly = TRUE';
    if (search)             add('t.description ILIKE ?', `%${search}%`);

    query += ' ORDER BY t.date DESC, t.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    serverError(res, err);
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} WHERE t.id = $1 AND t.company_id = $2`,
      [req.params.id, req.user.companyId]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Transaction not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
});

/** Validate the body and check that the category belongs to the user's company and matches the type. */
async function validate(body, companyId) {
  const { amount, date, type, description, paymentMethod, categoryId } = body;
  if (!isPositiveAmount(amount)) return 'Amount must be a positive number.';
  if (!isValidDate(date)) return 'Date must be in the format YYYY-MM-DD.';
  if (!TYPES.includes(type)) return 'Type must be income or expense.';
  if (!description?.trim()) return 'Description is required.';
  if (!METHODS.includes(paymentMethod)) return 'Payment method must be cash, card or transfer.';
  if (!categoryId) return 'Category is required.';
  const { rows } = await pool.query('SELECT type FROM categories WHERE id = $1 AND company_id = $2',
    [categoryId, companyId]);
  if (!rows.length) return 'Category not found.';
  if (rows[0].type !== type) return `Please choose an ${type} category.`;
  return null;
}

/** Re-run anomaly detection, then return the saved row with its up-to-date is_anomaly flag. */
async function savedRow(id, companyId) {
  await detectAnomalies(companyId);
  const { rows } = await pool.query(`${SELECT} WHERE t.id = $1`, [id]);
  return rows[0];
}

// POST /api/transactions — Owner or Admin
router.post('/', authorize('owner', 'admin'), async (req, res) => {
  try {
    const error = await validate(req.body, req.user.companyId);
    if (error) return badRequest(res, error);
    const { amount, date, type, description, paymentMethod, categoryId, receiptUrl } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO transactions (amount, date, type, description, payment_method, category_id, company_id, user_id, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [amount, date, type, description.trim(), paymentMethod, categoryId,
       req.user.companyId, req.user.id, receiptUrl || null]
    );
    res.status(201).json({ success: true, data: await savedRow(rows[0].id, req.user.companyId) });
  } catch (err) {
    serverError(res, err);
  }
});

// PUT /api/transactions/:id — Owner or Admin
router.put('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const error = await validate(req.body, req.user.companyId);
    if (error) return badRequest(res, error);
    const { amount, date, type, description, paymentMethod, categoryId, receiptUrl } = req.body;
    const { rows } = await pool.query(
      `UPDATE transactions SET
         amount = $1, date = $2, type = $3, description = $4, payment_method = $5,
         category_id = $6, receipt_url = $7, updated_at = NOW()
       WHERE id = $8 AND company_id = $9 RETURNING id`,
      [amount, date, type, description.trim(), paymentMethod, categoryId,
       receiptUrl || null, req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Transaction not found.' });
    res.json({ success: true, data: await savedRow(rows[0].id, req.user.companyId) });
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE /api/transactions/:id — Owner or Admin
router.delete('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Transaction not found.' });
    await detectAnomalies(req.user.companyId);
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
