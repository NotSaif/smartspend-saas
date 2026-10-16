const pool = require('../db/pool');

/**
 * Statistical anomaly detection (z-score) for one company's expenses.
 *
 * For every expense category the mean (μ) and sample standard deviation (σ) are calculated.
 *  - Categories with at least 3 expenses: an expense is anomalous when z = (x − μ) / σ > 2.
 *  - Categories with 1–2 expenses (too little history for σ): fallback rule x > 1.5 × μ.
 *
 * The is_anomaly flag of the company's transactions is updated to match, and the flagged
 * transactions are returned (largest deviation first).
 */
const DETECT_SQL = `
  WITH category_stats AS (
    SELECT category_id,
           AVG(amount)         AS avg_amount,
           STDDEV_SAMP(amount) AS stddev_amount,
           COUNT(*)            AS sample_count
    FROM transactions
    WHERE company_id = $1 AND type = 'expense' AND category_id IS NOT NULL
    GROUP BY category_id
  )
  SELECT t.id, t.amount, t.date, t.description, t.payment_method, t.category_id, t.created_at,
         c.name  AS category_name, c.color AS category_color, c.icon AS category_icon,
         ROUND(cs.avg_amount::numeric, 3)    AS avg_amount,
         ROUND(cs.stddev_amount::numeric, 3) AS stddev_amount,
         cs.sample_count,
         CASE WHEN cs.sample_count >= 3 THEN 'z-score' ELSE 'fallback' END AS rule,
         ROUND(((t.amount - cs.avg_amount) / NULLIF(cs.stddev_amount, 0))::numeric, 2) AS z_score,
         ROUND((t.amount / NULLIF(cs.avg_amount, 0))::numeric, 2) AS ratio
  FROM transactions t
  JOIN category_stats cs ON cs.category_id = t.category_id
  JOIN categories c      ON c.id = t.category_id
  WHERE t.company_id = $1 AND t.type = 'expense'
    AND (
      (cs.sample_count >= 3 AND cs.stddev_amount > 0
        AND (t.amount - cs.avg_amount) / cs.stddev_amount > 2)
      OR
      (cs.sample_count < 3 AND t.amount > 1.5 * cs.avg_amount)
    )
  ORDER BY ratio DESC
`;

async function detectAnomalies(companyId, db = pool) {
  const { rows } = await db.query(DETECT_SQL, [companyId]);
  const ids = rows.map(r => r.id);
  await db.query(
    `UPDATE transactions SET is_anomaly = (id = ANY($2::int[]))
     WHERE company_id = $1 AND is_anomaly IS DISTINCT FROM (id = ANY($2::int[]))`,
    [companyId, ids]
  );
  return rows;
}

module.exports = { detectAnomalies };
