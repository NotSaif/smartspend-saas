const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/anomalies
// Flags expense transactions exceeding the per-category mean by > 2 standard deviations.
// Requires at least 3 historical transactions in a category to produce a signal.
router.get('/', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.json({ success: true, data: [] });

    const { rows } = await pool.query(`
      WITH category_stats AS (
        SELECT
          category_id,
          AVG(amount)         AS avg_amount,
          STDDEV_SAMP(amount) AS stddev_amount,
          COUNT(*)            AS sample_count
        FROM transactions
        WHERE company_id = $1 AND type = 'expense'
        GROUP BY category_id
        HAVING COUNT(*) >= 3
      )
      SELECT
        t.id,
        t.amount,
        t.date,
        t.description,
        t.payment_method,
        t.category_id,
        t.receipt_url,
        t.created_at,
        c.name  AS category_name,
        c.color AS category_color,
        c.icon  AS category_icon,
        ROUND(cs.avg_amount::numeric, 3)    AS avg_amount,
        ROUND(cs.stddev_amount::numeric, 3) AS stddev_amount,
        cs.sample_count,
        ROUND((t.amount / NULLIF(cs.avg_amount, 0))::numeric, 2) AS ratio
      FROM transactions t
      JOIN category_stats cs ON cs.category_id = t.category_id
      JOIN categories c ON c.id = t.category_id
      WHERE t.company_id = $1
        AND t.type = 'expense'
        AND t.amount > (cs.avg_amount + 2 * COALESCE(cs.stddev_amount, cs.avg_amount * 0.5))
      ORDER BY ratio DESC
      LIMIT 20
    `, [companyId]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
