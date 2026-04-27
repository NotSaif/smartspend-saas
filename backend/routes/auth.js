const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password are required.' });

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email.toLowerCase()]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, companyId: user.company_id, avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee', companyId } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length)
      return res.status(409).json({ success: false, error: 'Email already registered.' });

    const hash = await bcrypt.hash(password, 10);
    const avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, avatar)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, company_id, avatar`,
      [name, email.toLowerCase(), hash, role, companyId || null, avatar]
    );

    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, role: rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true, token,
      user: { ...rows[0], companyId: rows[0].company_id },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile — update own name/email
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: 'Name and email required.' });
    const { rows } = await pool.query(
      `UPDATE users SET name=$1, email=$2
       WHERE id=$3
       RETURNING id, name, email, role, company_id, avatar`,
      [name.trim(), email.trim().toLowerCase(), req.user.id]
    );
    res.json({ success: true, user: { ...rows[0], companyId: rows[0].company_id } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'That email is already in use.' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, error: 'Both fields are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ success: false, error: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
