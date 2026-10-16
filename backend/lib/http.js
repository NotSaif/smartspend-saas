/**
 * Send a 500 response without leaking internal error details in production.
 */
const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
};

const badRequest = (res, error) => res.status(400).json({ success: false, error });

const isValidDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

const isPositiveAmount = (n) => {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 && v < 10000000;
};

module.exports = { serverError, badRequest, isValidDate, isPositiveAmount };
