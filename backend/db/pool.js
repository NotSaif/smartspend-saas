const { Pool, types } = require('pg');
require('dotenv').config();

// Return PostgreSQL DATE columns as plain 'YYYY-MM-DD' strings. By default pg converts them to
// JavaScript Date objects at local midnight, which shifts dates back one day in UTC+ time zones
// such as Bahrain (UTC+3) once they are serialised to JSON.
types.setTypeParser(1082, (value) => value);

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'smartspend',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });

pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

module.exports = pool;
