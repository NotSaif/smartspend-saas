const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { detectAnomalies } = require('../lib/anomalies');
const { serverError } = require('../lib/http');

router.use(authenticate);

// GET /api/anomalies — run the z-score engine for the company and return the flagged expenses
router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: await detectAnomalies(req.user.companyId) });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
