require('dotenv').config();
const databaseCon = require('../config/db');

(async () => {
    try {
        const tables = ['ATTENDANCE', 'ATTENDANCE_SUMMARY', 'PAYROLL', 'ADVANCE_REPAYMENT', 'ADVANCE_SALARY', 'EMPLOYEE_LEAVE'];
        console.log('📊 Counting records in HR tables:');
        for (const table of tables) {
            const [rows] = await databaseCon.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`- ${table}: ${rows[0].count} records`);
        }
    } catch (err) {
        console.error('❌ Error counting records:', err.message);
    } finally {
        process.exit(0);
    }
})();
