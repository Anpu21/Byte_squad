const sequelize = require('./config/db');

(async () => {
  try {
    const [rows] = await sequelize.query('SELECT DISTINCT Payment_Method FROM payment ORDER BY Payment_Method');
    console.log('Current Payment_Method values in database:');
    rows.forEach(r => console.log('  -', r.Payment_Method || '(null)'));
    
    const [rows2] = await sequelize.query('SELECT * FROM payment');
    console.log(`\nTotal payment records: ${rows2.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
