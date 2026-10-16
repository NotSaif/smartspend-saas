const pool = require('./pool');

const schema = `
-- Companies (tenants)
CREATE TABLE IF NOT EXISTS companies (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  industry    VARCHAR(100),
  location    VARCHAR(100),
  is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Users — role values: 'owner' | 'admin' | 'employee'
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'employee'
                  CHECK (role IN ('owner', 'admin', 'employee')),
  company_id    INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  avatar        VARCHAR(10),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  color       VARCHAR(7)  DEFAULT '#3B82F6',
  icon        VARCHAR(10) DEFAULT '📁',
  company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Transactions (amounts in Bahraini Dinar, 3 decimal places)
CREATE TABLE IF NOT EXISTS transactions (
  id              SERIAL PRIMARY KEY,
  amount          DECIMAL(10, 3) NOT NULL CHECK (amount > 0),
  date            DATE NOT NULL,
  type            VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  description     TEXT NOT NULL,
  payment_method  VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  receipt_url     VARCHAR(500),
  is_anomaly      BOOLEAN NOT NULL DEFAULT FALSE,
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  company_id      INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Budgets (one limit per category per month)
CREATE TABLE IF NOT EXISTS budgets (
  id           SERIAL PRIMARY KEY,
  amount       DECIMAL(10, 3) NOT NULL CHECK (amount > 0),
  month        SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year         SMALLINT NOT NULL CHECK (year >= 2000),
  category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  company_id   INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE (category_id, month, year, company_id)
);

-- Upgrades for databases created by earlier versions of this script
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE transactions ALTER COLUMN amount TYPE DECIMAL(10, 3);
ALTER TABLE budgets      ALTER COLUMN amount TYPE DECIMAL(10, 3);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_company   ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_company_month  ON budgets(company_id, month, year);
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    await client.query(schema);
    console.log('✅ Database migrations complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
