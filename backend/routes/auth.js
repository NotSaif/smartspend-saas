const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const { seedDefaultCategories } = require('./categories');
const { serverError, badRequest } = require('../lib/http');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
);

const initials = (name) => name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const publicUser = (u, companyName) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  companyId: u.company_id, companyName, avatar: u.avatar,
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, 'Email and password are required.');

    const { rows } = await pool.query(
      `SELECT u.*, c.name AS company_name FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE u.email = $1 AND u.is_active = TRUE`,
      [String(email).trim().toLowerCase()]
    );
    const user = rows[0];
    // Same message for unknown email and wrong password, so emails cannot be discovered.
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });

    res.json({ success: true, token: signToken(user), user: publicUser(user, user.company_name) });
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/auth/register — creates a new company (tenant) and its Business Owner account
router.post('/register', async (req, res) => {
  const { companyName, industry, location, name, email, password } = req.body;
  if (!companyName?.trim() || !name?.trim() || !email || !password)
    return badRequest(res, 'Company name, full name, email and password are required.');
  if (!EMAIL_RE.test(email)) return badRequest(res, 'Please enter a valid email address.');
  if (password.length < 6) return badRequest(res, 'Password must be at least 6 characters.');

  const client = await pool.connect();
  try {
    const mail = email.trim().toLowerCase();
    const exists = await client.query('SELECT 1 FROM users WHERE email = $1', [mail]);
    if (exists.rows.length) return res.status(409).json({ success: false, error: 'Email already registered.' });

    await client.query('BEGIN');
    const { rows: [company] } = await client.query(
      'INSERT INTO companies (name, industry, location) VALUES ($1, $2, $3) RETURNING id, name',
      [companyName.trim(), industry?.trim() || null, location?.trim() || null]
    );
    const hash = await bcrypt.hash(password, 10);
    const { rows: [user] } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, avatar)
       VALUES ($1, $2, $3, 'owner', $4, $5) RETURNING *`,
      [name.trim(), mail, hash, company.id, initials(name)]
    );
    await seedDefaultCategories(company.id, client);
    await client.query('COMMIT');

    res.status(201).json({ success: true, token: signToken(user), user: publicUser(user, company.name) });
  } catch (err) {
    await client.query('ROLLBACK');
    serverError(res, err);
  } finally {
    client.release();
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const u = req.user;
  res.json({ success: true, user: publicUser(u, u.companyName) });
});

// PUT /api/auth/profile — update own name/email
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name?.trim() || !email) return badRequest(res, 'Name and email are required.');
    if (!EMAIL_RE.test(email)) return badRequest(res, 'Please enter a valid email address.');
    const { rows } = await pool.query(
      `UPDATE users SET name = $1, email = $2, avatar = $3 WHERE id = $4 RETURNING *`,
      [name.trim(), email.trim().toLowerCase(), initials(name), req.user.id]
    );
    res.json({ success: true, user: publicUser(rows[0], req.user.companyName) });
  } catch (err) {
    if (err.code === '23505') return badRequest(res, 'That email is already in use.');
    serverError(res, err);
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return badRequest(res, 'Both fields are required.');
    if (newPassword.length < 6) return badRequest(res, 'New password must be at least 6 characters.');

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!(await bcrypt.compare(currentPassword, rows[0].password_hash)))
      // 400, not 401: a 401 makes the client end the session.
      return badRequest(res, 'Current password is incorrect.');

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
