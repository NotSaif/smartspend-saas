/**
 * Fix admin and employee password hashes — run once to correct the seed mistake.
 */
const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  const client = await pool.connect();
  try {
    console.log('🔄 Fixing user password hashes...');

    const adminHash = await bcrypt.hash('admin123', 10);
    const empHash   = await bcrypt.hash('emp123',   10);
    const ownerHash = await bcrypt.hash('owner123', 10);

    await client.query(`UPDATE users SET password_hash=$1 WHERE email='admin@smartspend.bh'`,   [adminHash]);
    await client.query(`UPDATE users SET password_hash=$1 WHERE email='accountant@alzain.bh'`, [empHash]);
    await client.query(`UPDATE users SET password_hash=$1 WHERE email='owner@alzain.bh'`,      [ownerHash]);
    await client.query(`UPDATE users SET password_hash=$1 WHERE email='owner@gulftech.bh'`,    [ownerHash]);

    console.log('✅ Passwords fixed successfully.');
    console.log('   admin@smartspend.bh     → admin123');
    console.log('   accountant@alzain.bh    → emp123');
    console.log('   owner@alzain.bh         → owner123');
    console.log('   owner@gulftech.bh       → owner123');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

fixPasswords();
