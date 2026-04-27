const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');
    await client.query('BEGIN');

    // Companies
    const { rows: [co1] } = await client.query(`
      INSERT INTO companies (name, industry, location, is_demo)
      VALUES ('Al-Zain Trading Co.', 'Retail & Trading', 'Manama', true)
      ON CONFLICT DO NOTHING RETURNING id`);
    const { rows: [co2] } = await client.query(`
      INSERT INTO companies (name, industry, location, is_demo)
      VALUES ('Gulf Tech Solutions', 'Information Technology', 'Seef', true)
      ON CONFLICT DO NOTHING RETURNING id`);

    const companyId = co1?.id || 1;

    // Users
    const ownerHash = await bcrypt.hash('owner123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);
    const empHash   = await bcrypt.hash('emp123',   10);

    await client.query(`
      INSERT INTO users (name, email, password_hash, role, company_id, avatar)
      VALUES
        ('Ahmed Al-Zain',       'owner@alzain.bh',      $1, 'owner',    $4, 'AZ'),
        ('Fatima Hassan',       'accountant@alzain.bh', $3, 'employee', $4, 'FH'),
        ('Khalid Al-Mansoori', 'admin@smartspend.bh',  $2, 'admin',    NULL,'KM'),
        ('Sara Al-Dossari',    'owner@gulftech.bh',    $1, 'owner',    $5, 'SD')
      ON CONFLICT (email) DO NOTHING`,
      [ownerHash, adminHash, empHash, companyId, co2?.id || 2]
    );

    // Categories
    const catResult = await client.query(`
      INSERT INTO categories (name, type, color, icon, company_id) VALUES
        ('Salaries & Wages',  'expense', '#EF4444', '👥', $1),
        ('Rent & Utilities',  'expense', '#F59E0B', '🏢', $1),
        ('Marketing & Ads',   'expense', '#8B5CF6', '📣', $1),
        ('Inventory & Stock', 'expense', '#EC4899', '📦', $1),
        ('Transportation',    'expense', '#06B6D4', '🚗', $1),
        ('Office Supplies',   'expense', '#84CC16', '✏️', $1),
        ('Product Sales',     'income',  '#10B981', '💰', $1),
        ('Service Revenue',   'income',  '#3B82F6', '🔧', $1),
        ('Consulting Fees',   'income',  '#2563EB', '💼', $1)
      ON CONFLICT DO NOTHING RETURNING id`,
      [companyId]
    );
    const cats = catResult.rows;

    if (cats.length > 0) {
      // Transactions (April 2026 sample data)
      const today = new Date();
      const getDate = (d) => { const dt = new Date(today); dt.setDate(dt.getDate()-d); return dt.toISOString().split('T')[0]; };

      await client.query(`
        INSERT INTO transactions (amount, date, type, description, payment_method, category_id, company_id, user_id)
        SELECT t.amount, t.date::date, t.type, t.description, t.payment_method,
               (SELECT id FROM categories WHERE company_id=$1 LIMIT 1 OFFSET t.cat_offset),
               $1,
               (SELECT id FROM users WHERE company_id=$1 LIMIT 1)
        FROM (VALUES
          (4500.000, '${getDate(2)}',  'income',  'Wholesale order - Al-Hawaj Group',    'transfer', 6),
          (1200.000, '${getDate(3)}',  'expense', 'Monthly payroll - part 1',             'transfer', 0),
          (850.000,  '${getDate(4)}',  'expense', 'April office rent - Manama block 317', 'transfer', 1),
          (320.500,  '${getDate(5)}',  'expense', 'Instagram & Google Ads campaign',      'card',     2),
          (2100.000, '${getDate(6)}',  'income',  'Retail walk-in sales - Week 2',        'cash',     6),
          (1850.000, '${getDate(7)}',  'expense', 'Restocking - household goods',         'transfer', 3),
          (95.000,   '${getDate(8)}',  'expense', 'Delivery van fuel - April',            'cash',     4),
          (750.000,  '${getDate(9)}',  'income',  'Installation service fee',             'card',     7),
          (45.750,   '${getDate(10)}', 'expense', 'Stationery & printer ink',             'cash',     5),
          (600.000,  '${getDate(12)}', 'income',  'Business advisory - Tamkeen workshop', 'transfer', 8)
        ) AS t(amount, date, type, description, payment_method, cat_offset)
        ON CONFLICT DO NOTHING`,
        [companyId]
      );

      // Budgets
      const m = today.getMonth() + 1;
      const y = today.getFullYear();
      const budgetAmounts = [2500, 1100, 400, 2000, 150, 80];
      for (let i = 0; i < Math.min(cats.length, 6); i++) {
        await client.query(`
          INSERT INTO budgets (amount, month, year, category_id, company_id)
          VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
          [budgetAmounts[i], m, y, cats[i].id, companyId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
