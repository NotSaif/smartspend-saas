const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

/**
 * Verify the JWT from the Authorization header and load the active user.
 * Attaches req.user = { id, name, email, role, companyId, companyName, avatar }.
 * The company always comes from the database record of the authenticated user,
 * never from the request, which keeps every tenant's data isolated.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided.' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.company_id, u.avatar, c.name AS company_name
       FROM users u JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'User not found or deactivated.' });
    }
    const u = rows[0];
    req.user = { ...u, companyId: u.company_id, companyName: u.company_name };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};

/**
 * Restrict a route to specific roles, e.g. authorize('owner', 'admin').
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: 'Access denied. Insufficient permissions.' });
  }
  next();
};

module.exports = { authenticate, authorize };
