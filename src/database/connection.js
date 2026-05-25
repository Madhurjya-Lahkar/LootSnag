import * as mariadb from 'mariadb';
import 'dotenv/config';

const pool = mariadb.createPool({
  host:             process.env.DB_HOST,
  port:             parseInt(process.env.DB_PORT || '3306'),
  user:             process.env.DB_USER,
  password:         process.env.DB_PASS,
  database:         process.env.DB_NAME,
  connectionLimit:  10,
  acquireTimeout:   10000,
  idleTimeout:      60000,
  charset:          'utf8mb4',
  ssl:              true, 
});

export async function query(sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql, params);
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function testConnection() {
  const conn = await pool.getConnection();
  conn.release();
}

export default pool;
