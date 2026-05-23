require('dotenv').config();
const databaseCon = require('./config/db');

(async () => {
    try {
        console.log('🔄 Fetching all tables in shanel_erp database...');
        const [results] = await databaseCon.query("SHOW TABLES;");
        console.log('📋 Existing tables:');
        results.forEach(r => {
            console.log(`- ${Object.values(r)[0]}`);
        });
    } catch (err) {
        console.error('❌ Error showing tables:', err.message);
    } finally {
        process.exit(0);
    }
})();
