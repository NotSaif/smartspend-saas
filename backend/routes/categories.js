const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const { serverError, badRequest } = require('../lib/http');

// Default categories created for every new company
const DEFAULT_CATEGORIES = [
  // Income
  { name: 'Product Sales',      type: 'income',  color: '#10B981', icon: '🛒' },
  { name: 'Service Revenue',    type: 'income',  color: '#3B82F6', icon: '💼' },
  { name: 'Rental Income',      type: 'income',  color: '#8B5CF6', icon: '🏢' },
  { name: 'Investment Returns', type: 'income',  color: '#F59E0B', icon: '📈' },
  { name: 'Other Income',       type: 'income',  color: '#6B7280', icon: '💰' },
  // Expense
  { name: 'Salaries & Wages',   type: 'expense', color: '#EF4444', icon: '👥' },
  { name: 'Rent & Utilities',   type: 'expense', color: '#F97316', icon: '🏠' },
  { name: 'Marketing & Ads',    type: 'expense', color: '#EC4899', icon: '📣' },
  { name: 'Office Supplies',    type: 'expense', color: '#14B8A6', icon: '📦' },
  { name: 'Travel & Transport', type: 'expense', color: '#0EA5E9', icon: '✈️' },
  { name: 'IT & Software',      type: 'expense', color: '#6366F1', icon: '💻' },
  { name: 'Maintenance',        type: 'expense', color: '#84CC16', icon: '🔧' },
  { name: 'Banking & Fees',     type: 'expense', color: '#A78BFA', icon: '🏦' },
  { name: 'Other Expenses',     type: 'expense', color: '#9CA3AF', icon: '📋' },
];

const seedDefaultCategories = async (companyId, db = pool) => {
  for (const c of DEFAULT_CATEGORIES) {
    await db.query(
      'INSERT INTO categories (name, type, color, icon, company_id) VALUES ($1, $2, $3, $4, $5)',
      [c.name, c.type, c.color, c.icon, companyId]
    );
  }
};

const TYPES = ['income', 'expense'];
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

router.use(authenticate);

// GET /api/categories — the company's categories
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categories WHERE company_id = $1 ORDER BY type DESC, name ASC',
      [req.user.companyId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    serverError(res, err);
  }
});

const validate = ({ name, type, color }) => {
  if (!name?.trim()) return 'Category name is required.';
  if (!TYPES.includes(type)) return 'Type must be income or expense.';
  if (color && !COLOR_RE.test(color)) return 'Colour must be a hex value such as #3B82F6.';
  return null;
};

// POST /api/categories — Owner or Admin
router.post('/', authorize('owner', 'admin'), async (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return badRequest(res, error);
    const { name, type, color, icon } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO categories (name, type, color, icon, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name.trim(), type, color || '#3B82F6', (icon || '📁').slice(0, 10), req.user.companyId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
});

// PUT /api/categories/:id — Owner or Admin
router.put('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return badRequest(res, error);
    const { name, type, color, icon } = req.body;
    const used = await pool.query(
      'SELECT 1 FROM transactions WHERE category_id = $1 AND company_id = $2 AND type <> $3 LIMIT 1',
      [req.params.id, req.user.companyId, type]
    );
    if (used.rows.length) return badRequest(res, 'This category already has transactions of the other type.');
    const { rows } = await pool.query(
      'UPDATE categories SET name = $1, type = $2, color = $3, icon = $4 WHERE id = $5 AND company_id = $6 RETURNING *',
      [name.trim(), type, color || '#3B82F6', (icon || '📁').slice(0, 10), req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Category not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE /api/categories/:id — Owner or Admin; refused while transactions still use it
router.delete('/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const used = await pool.query(
      'SELECT COUNT(*)::int AS n FROM transactions WHERE category_id = $1 AND company_id = $2',
      [req.params.id, req.user.companyId]
    );
    if (used.rows[0].n > 0)
      return res.status(409).json({
        success: false,
        error: `This category is used by ${used.rows[0].n} transaction(s). Move or delete them first.`,
      });
    const { rows } = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Category not found.' });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
module.exports.seedDefaultCategories = seedDefaultCategories;
