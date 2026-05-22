require('dotenv').config();
const databaseCon = require('../config/db');

(async () => {
    try {
        console.log('🚀 Starting data clearance for Attendance and Payroll...');
        
        // Disable foreign key checks temporarily to allow truncation/deletion in any order
        await databaseCon.query('SET FOREIGN_KEY_CHECKS = 0');
        
        const tables = [
            'ADVANCE_REPAYMENT',
            'PAYROLL',
            'ATTENDANCE',
            'ATTENDANCE_SUMMARY',
            'EMPLOYEE_LEAVE'
        ];

        for (const table of tables) {
            console.log(`🧹 Clearing ${table}...`);
            await databaseCon.query(`TRUNCATE TABLE ${table}`);
        }

        await databaseCon.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('✅ Success: All attendance and payroll data has been cleared.');
        console.log('🔄 The system is now ready for fresh entries from today.');
        
    } catch (err) {
        console.error('❌ Error during clearance:', err.message);
    } finally {
        process.exit(0);
    }
})();
