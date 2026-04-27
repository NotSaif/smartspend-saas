const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// ── Default categories to seed for new companies ──────────────
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
  { name: 'Travel & Transport', type: 'expense', color: '#0EA5E9', icon: '✈️'  },
  { name: 'IT & Software',      type: 'expense', color: '#6366F1', icon: '💻' },
  { name: 'Maintenance',        type: 'expense', color: '#84CC16', icon: '🔧' },
  { name: 'Banking & Fees',     type: 'expense', color: '#A78BFA', icon: '🏦' },
  { name: 'Other Expenses',     type: 'expense', color: '#9CA3AF', icon: '📋' },
];

// Exported so companies route can call it
const seedDefaultCategories = async (companyId) => {
  const values = DEFAULT_CATEGORIES.map((_, i) => {
    const b = i * 4;
    return `($${b+1},$${b+2},$${b+3},$${b+4},$${i * 0 + 5 + i * 0})`;
  });
  // Build flat params array
  const params = [];
  DEFAULT_CATEGORIES.forEach(c => {
    params.push(c.name, c.type, c.color, c.icon);
  });
  params.push(companyId);

  // Use individual inserts (simpler & works for any length)
  for (const c of DEFAULT_CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (name, type, color, icon, company_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT DO NOTHING`,
      [c.name, c.type, c.color, c.icon, companyId]
    );
  }
};

module.exports.seedDefaultCategories = seedDefaultCategories;

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    let rows;
    if (req.user.companyId) {
      // Check if company has any categories — if not, seed defaults first
      const check = await pool.query(
        'SELECT COUNT(*) FROM categories WHERE company_id=$1', [req.user.companyId]
      );
      if (parseInt(check.rows[0].count) === 0) {
        await seedDefaultCategories(req.user.companyId);
      }
      ({ rows } = await pool.query(
        'SELECT * FROM categories WHERE company_id=$1 ORDER BY type DESC, name ASC',
        [req.user.companyId]
      ));
    } else {
      // Admin with no company — return all categories
      ({ rows } = await pool.query(
        'SELECT * FROM categories ORDER BY company_id, type DESC, name ASC'
      ));
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/categories  — owner OR admin can create
router.post('/', authorize('admin', 'owner'), async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;
    if (!name || !type) return res.status(400).json({ success: false, error: 'Name and type are required.' });
    const { rows } = await pool.query(
      'INSERT INTO categories (name, type, color, icon, company_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, type, color || '#3B82F6', icon || '📁', req.user.companyId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/categories/:id  — owner OR admin
router.put('/:id', authorize('admin', 'owner'), async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;
    const { rows } = await pool.query(
      'UPDATE categories SET name=$1,type=$2,color=$3,icon=$4 WHERE id=$5 AND company_id=$6 RETURNING *',
      [name, type, color, icon, req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Category not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/categories/:id  — owner OR admin
router.delete('/:id', authorize('admin', 'owner'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM categories WHERE id=$1 AND company_id=$2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Category not found.' });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.seedDefaultCategories = seedDefaultCategories;
