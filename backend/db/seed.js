/**
 * Demo data for SmartSpend. Running it again resets the two demo companies.
 * Transactions cover the current month and the three months before it, so the
 * dashboard always has data, and include two unusual expenses for the anomaly engine.
 */
const pool = require('./pool');
const bcrypt = require('bcryptjs');
const { seedDefaultCategories } = require('../routes/categories');
const { detectAnomalies } = require('../lib/anomalies');

const DEMO_EMAILS = ['owner@general.bh', 'admin@general.bh', 'employee@general.bh', 'owner@brighttech.bh',
  // accounts from earlier versions of the demo data
  'owner@alzain.bh', 'admin@alzain.bh', 'accountant@alzain.bh', 'owner@gulftech.bh', 'admin@smartspend.bh'];

// [monthsAgo, day, type, amount, description, method, category]
const GENERAL = [];
for (const ago of [3, 2, 1, 0]) {
  GENERAL.push(
    [ago, 1,  'expense', 850.000,  'Monthly office rent - Manama block 317', 'transfer', 'Rent & Utilities'],
    [ago, 3,  'expense', 2400.000, 'Monthly payroll',                         'transfer', 'Salaries & Wages'],
    [ago, 5,  'income',  4800.000 + ago * 150, 'Wholesale order - City Mart', 'transfer', 'Product Sales'],
    [ago, 8,  'expense', [96.500, 102.000, 91.250, 98.750][ago], 'Delivery van fuel', 'cash', 'Travel & Transport'],
    [ago, 10, 'expense', [310.000, 295.000, 330.000, 320.500][ago], 'Instagram & Google Ads campaign', 'card', 'Marketing & Ads'],
    [ago, 12, 'expense', [45.750, 38.900, 52.300, 41.000][ago], 'Stationery & printer ink', 'cash', 'Office Supplies'],
    [ago, 14, 'income',  [2100.000, 1900.000, 2250.000, 2050.000][ago], 'Retail walk-in sales', 'cash', 'Product Sales'],
    [ago, 18, 'expense', 120.000,  'Cloud accounting & email subscriptions', 'card', 'IT & Software'],
    [ago, 20, 'expense', [285.000, 300.000, 275.500, 305.000][ago], 'Flyer printing & social media boosts', 'card', 'Marketing & Ads'],
    [ago, 22, 'expense', [104.000, 92.000, 107.500, 99.000][ago], 'Delivery van fuel', 'cash', 'Travel & Transport'],
    [ago, 25, 'income',  [750.000, 650.000, 700.000, 900.000][ago], 'Installation service fee', 'card', 'Service Revenue'],
  );
}
// Two unusual expenses this month — detected by the z-score engine
GENERAL.push(
  [0, 13, 'expense', 1450.000, 'Emergency delivery van engine repair', 'card',     'Travel & Transport'],
  [0, 11, 'expense', 2350.000, 'Billboard campaign - Exhibition Road', 'transfer', 'Marketing & Ads'],
);

const BRIGHT_TECH = [
  [1, 4,  'income',  3200.000, 'Website development project',  'transfer', 'Service Revenue'],
  [1, 6,  'expense', 1800.000, 'Developer salaries',           'transfer', 'Salaries & Wages'],
  [0, 4,  'income',  2750.000, 'Mobile app maintenance contract', 'transfer', 'Service Revenue'],
  [0, 6,  'expense', 1800.000, 'Developer salaries',           'transfer', 'Salaries & Wages'],
  [0, 9,  'expense', 240.000,  'Cloud hosting',                'card',     'IT & Software'],
];

const BUDGETS = [
  ['Salaries & Wages', 2500], ['Rent & Utilities', 900], ['Marketing & Ads', 600],
  ['Travel & Transport', 400], ['Office Supplies', 80], ['IT & Software', 150],
];

function dateFor(monthsAgo, day) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  // keep this month's records in the past
  const maxDay = monthsAgo === 0 ? Math.max(1, now.getDate()) : lastDay;
  const dd = Math.min(day, maxDay);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

async function createCompany(client, name, industry, location) {
  const { rows: [c] } = await client.query(
    'INSERT INTO companies (name, industry, location, is_demo) VALUES ($1, $2, $3, TRUE) RETURNING id',
    [name, industry, location]);
  await seedDefaultCategories(c.id, client);
  return c.id;
}

async function addTransactions(client, companyId, userId, list) {
  const { rows } = await client.query('SELECT id, name FROM categories WHERE company_id = $1', [companyId]);
  const cat = Object.fromEntries(rows.map(r => [r.name, r.id]));
  for (const [ago, day, type, amount, description, method, category] of list) {
    await client.query(
      `INSERT INTO transactions (amount, date, type, description, payment_method, category_id, company_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [amount, dateFor(ago, day), type, description, method, cat[category], companyId, userId]);
  }
  return cat;
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding demo data...');
    await client.query('BEGIN');

    // Reset previous demo data (users are removed with their company)
    await client.query('DELETE FROM users WHERE email = ANY($1)', [DEMO_EMAILS]);
    await client.query('DELETE FROM companies WHERE is_demo = TRUE');

    const general = await createCompany(client, 'General Trading Co.', 'Retail & Trading', 'Manama, Bahrain');
    const brightTech = await createCompany(client, 'Bright Tech Solutions', 'Information Technology', 'Seef, Bahrain');

    const owner = await bcrypt.hash('owner123', 10);
    const admin = await bcrypt.hash('admin123', 10);
    const emp = await bcrypt.hash('emp123', 10);
    const { rows: users } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, avatar) VALUES
         ('Alex Morgan', 'owner@general.bh',    $1, 'owner',    $4, 'AM'),
         ('Max Carter',  'admin@general.bh',    $2, 'admin',    $4, 'MC'),
         ('Clara Hayes', 'employee@general.bh', $3, 'employee', $4, 'CH'),
         ('Sam Wilson',  'owner@brighttech.bh', $1, 'owner',    $5, 'SW')
       RETURNING id, email`,
      [owner, admin, emp, general, brightTech]);
    const uid = Object.fromEntries(users.map(u => [u.email, u.id]));

    const cat = await addTransactions(client, general, uid['owner@general.bh'], GENERAL);
    await addTransactions(client, brightTech, uid['owner@brighttech.bh'], BRIGHT_TECH);

    const now = new Date();
    for (const [name, amount] of BUDGETS) {
      await client.query(
        'INSERT INTO budgets (amount, month, year, category_id, company_id) VALUES ($1, $2, $3, $4, $5)',
        [amount, now.getMonth() + 1, now.getFullYear(), cat[name], general]);
    }

    await detectAnomalies(general, client);
    await detectAnomalies(brightTech, client);

    await client.query('COMMIT');
    console.log('✅ Demo data ready. Logins: owner@general.bh / owner123, admin@general.bh / admin123, '
      + 'employee@general.bh / emp123, owner@brighttech.bh / owner123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
