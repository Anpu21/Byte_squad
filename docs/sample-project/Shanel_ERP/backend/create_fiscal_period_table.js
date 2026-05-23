require('dotenv').config();
const FiscalPeriod = require('./models/finance/FiscalPeriod');

(async () => {
    try {
        console.log('🔄 Syncing FiscalPeriod model to create FISCAL_PERIOD table...');
        await FiscalPeriod.sync({ alter: true });
        console.log('✅ Successfully created FISCAL_PERIOD table!');

        // Let's seed a default open period for the current year
        const count = await FiscalPeriod.count();
        if (count === 0) {
            console.log('🌱 Seeding default Fiscal Period...');
            await FiscalPeriod.create({
                Period_Name: 'FY 2026',
                Start_Date: '2026-01-01',
                End_Date: '2026-12-31',
                Status: 'OPEN',
                Is_Year_End: false,
                Created_At: new Date()
            });
            console.log('✅ Seeding completed!');
        } else {
            console.log('ℹ️ Fiscal Period table already has records.');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit(0);
    }
})();
