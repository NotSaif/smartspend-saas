const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const { serverError, badRequest } = require('../lib/http');

// The Business Owner manages the user accounts of their own company only.
router.use(authenticate, authorize('owner'));

const ASSIGNABLE_ROLES = ['admin', 'employee'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELDS = 'id, name, email, role, avatar, is_active, created_at';
const initials = (name) => name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${FIELDS} FROM users WHERE company_id = $1 ORDER BY role = 'owner' DESC, created_at`,
      [req.user.companyId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/users — create an Administrator or Employee account in the owner's company
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name?.trim() || !email || !password) return badRequest(res, 'Name, email and password are required.');
    if (!EMAIL_RE.test(email)) return badRequest(res, 'Please enter a valid email address.');
    if (password.length < 6) return badRequest(res, 'Password must be at least 6 characters.');
    if (!ASSIGNABLE_ROLES.includes(role)) return badRequest(res, 'Role must be admin or employee.');

    const mail = email.trim().toLowerCase();
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [mail]);
    if (exists.rows.length) return res.status(409).json({ success: false, error: 'Email already in use.' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, avatar)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${FIELDS}`,
      [name.trim(), mail, hash, role, req.user.companyId, initials(name)]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
});

// PUT /api/users/:id — change name, email, role or active status (not of the owner account)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    if (!name?.trim() || !email) return badRequest(res, 'Name and email are required.');
    if (!EMAIL_RE.test(email)) return badRequest(res, 'Please enter a valid email address.');
    if (!ASSIGNABLE_ROLES.includes(role)) return badRequest(res, 'Role must be admin or employee.');
    if (parseInt(req.params.id) === req.user.id)
      return badRequest(res, 'Use My Profile to edit your own account.');

    const { rows } = await pool.query(
      `UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, avatar = $5
       WHERE id = $6 AND company_id = $7 AND role <> 'owner' RETURNING ${FIELDS}`,
      [name.trim(), email.trim().toLowerCase(), role, isActive !== false, initials(name),
       req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return badRequest(res, 'That email is already in use.');
    serverError(res, err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return badRequest(res, 'You cannot delete your own account.');
    const { rows } = await pool.query(
      `DELETE FROM users WHERE id = $1 AND company_id = $2 AND role <> 'owner' RETURNING id`,
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
