/**
 * Migration: Add is_demo flag to companies table
 * Run once: node backend/db/migrations/add_is_demo.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('../pool');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add is_demo column if it doesn't exist
    await client.query(`
      ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE
    `);

    // Mark Al-Zain Trading Co. (and any other seeded companies) as demo
    // We identify them by name — adjust if needed
    const demoNames = ['Al-Zain Trading Co.', 'Al-Zain', 'Tech Innovations LLC'];
    for (const name of demoNames) {
      await client.query(
        `UPDATE companies SET is_demo = TRUE WHERE name ILIKE $1`,
        [name]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Migration complete: is_demo column added and demo companies marked.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
