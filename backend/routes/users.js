const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.company_id, u.avatar, u.is_active, u.created_at,
              c.name AS company_name, c.is_demo AS company_is_demo
       FROM users u LEFT JOIN companies c ON c.id = u.company_id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });

    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows.length)
      return res.status(409).json({ success: false, error: 'Email already in use.' });

    const hash = await bcrypt.hash(password, 10);
    const avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const { rows } = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,company_id,avatar) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,name,email,role,company_id,avatar',
      [name, email.toLowerCase(), hash, role || 'employee', companyId || null, avatar]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, companyId, isActive } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET name=$1,email=$2,role=$3,company_id=$4,is_active=$5 WHERE id=$6 RETURNING id,name,email,role,company_id,avatar,is_active',
      [name, email?.toLowerCase(), role, companyId || null, isActive ?? true, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, error: 'Cannot delete your own account.' });
    const { rows } = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
