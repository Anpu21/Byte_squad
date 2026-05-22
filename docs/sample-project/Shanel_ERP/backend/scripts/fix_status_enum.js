require('dotenv').config();
const sequelize = require('../config/db');

async function fixEnum() {
    try {
        console.log('Starting DB fix...');
        // Correcting the table name based on JournalEntry.js (JOURNAL_ENTRY)
        await sequelize.query("ALTER TABLE JOURNAL_ENTRY MODIFY COLUMN Status ENUM('Draft', 'Posted', 'Cancelled', 'Revised') DEFAULT 'Draft'");
        console.log('✅ Successfully updated JOURNAL_ENTRY Status ENUM');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating ENUM:', err);
        process.exit(1);
    }
}

fixEnum();
