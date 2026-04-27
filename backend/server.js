require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const authRoutes         = require('./routes/auth');
const transactionRoutes  = require('./routes/transactions');
const budgetRoutes       = require('./routes/budgets');
const categoryRoutes     = require('./routes/categories');
const userRoutes         = require('./routes/users');
const reportRoutes       = require('./routes/reports');
const companyRoutes      = require('./routes/companies');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost origin in dev, or the configured CLIENT_URL in prod
    const allowed = [process.env.CLIENT_URL];
    if (!origin || allowed.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── Rate limiting ────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: { success: false, error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth/login',   loginLimiter);
app.use('/api',              apiLimiter);
app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets',      budgetRoutes);
app.use('/api/categories',   categoryRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/reports',      reportRoutes);
app.use('/api/companies',    companyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SmartSpend API', version: '1.0.0', time: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ SmartSpend API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
