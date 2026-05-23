const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Prabashi@2003',
      database: 'shanel_erp'
    });
    
    const [rows] = await conn.execute('DESCRIBE EMPLOYEE');
    console.log('✅ EMPLOYEE Table Columns:');
    console.log('================================================');
    rows.forEach((r, i) => {
      console.log(`${i+1}. ${r.Field.padEnd(25)} | ${r.Type.padEnd(30)} | Null: ${r.Null}`);
    });
    console.log('================================================');
    console.log(`Total columns: ${rows.length}`);
    
    conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
