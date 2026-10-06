require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const tables = ['customers', 'orders', 'products', 'returns', 'refunds'];
    for (const table of tables) {
      const [rows] = await pool.query(`DESCRIBE \`${table}\``);
      console.log(`TABLE: ${table}`);
      console.log(JSON.stringify(rows, null, 2));
      console.log('---');
    }
  } catch (error) {
    console.error('SCHEMA_ERROR:', error.message);
  } finally {
    await pool.end();
  }
})();
