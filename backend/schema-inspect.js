const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'salman@123',
    database: 'ecommerce_db',
  });

  const tables = ['customers', 'orders', 'products', 'returns', 'refunds'];

  for (const table of tables) {
    try {
      const [rows] = await conn.query('DESCRIBE ??', [table]);
      console.log(`\nTABLE ${table}`);
      for (const row of rows) {
        console.log(`${row.Field} | ${row.Type} | ${row.Null} | ${row.Key} | ${row.Default ?? 'NULL'} | ${row.Extra}`);
      }
    } catch (error) {
      console.log(`\nTABLE ${table} missing`);
    }
  }

  await conn.end();
})().catch((error) => {
  console.error('Schema inspection failed:', error);
  process.exit(1);
});
