const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const { serverError, badRequest } = require('../lib/http');

router.use(authenticate);

// GET /api/companies/me — profile of the signed-in user's company
router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*,
         (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id)::int        AS user_count,
         (SELECT COUNT(*) FROM transactions t WHERE t.company_id = c.id)::int AS transaction_count
       FROM companies c WHERE c.id = $1`,
      [req.user.companyId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
});

// PUT /api/companies/me — Business Owner updates the company profile
router.put('/me', authorize('owner'), async (req, res) => {
  try {
    const { name, industry, location } = req.body;
    if (!name?.trim()) return badRequest(res, 'Company name is required.');
    const { rows } = await pool.query(
      'UPDATE companies SET name = $1, industry = $2, location = $3 WHERE id = $4 RETURNING *',
      [name.trim(), industry?.trim() || null, location?.trim() || null, req.user.companyId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
