const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

/**
 * Verify JWT from Authorization header.
 * Attaches req.user = { id, email, role, companyId }
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, name, email, role, company_id, avatar FROM users WHERE id = $1 AND is_active = TRUE',
      [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'User not found or deactivated.' });
    }
    req.user = { ...rows[0], companyId: rows[0].company_id };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};

/**
 * Restrict route to specific roles.
 * Usage: authorize('admin'), authorize('owner', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: 'Access denied. Insufficient permissions.' });
  }
  next();
};

module.exports = { authenticate, authorize };
