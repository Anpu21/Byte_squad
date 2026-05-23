const sequelize = require('../backend/config/db');
const Supplier = require('../backend/models/supplier/Supplier');
const SupplierTransaction = require('../backend/models/supplier/SupplierTransaction');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        // Sync new models
        await Supplier.sync();
        await SupplierTransaction.sync();
        console.log('Models synced');

        // Check if dummy supplier exists
        let supplier = await Supplier.findOne({ where: { S_Code: 'SUP-DUMMY' } });
        if (!supplier) {
            supplier = await Supplier.create({
                S_Code: 'SUP-DUMMY',
                S_Name: 'Acme Supplies Co.',
                Contact_Person: 'John Doe',
                Phone_No: '0771234567',
                Current_Balance: 50000.00,
                Status: 'Active'
            });
            console.log('Created dummy supplier');

        } else {
            console.log('Dummy supplier already exists');
        }

        // Check for transaction
        const trans = await SupplierTransaction.findOne({ where: { Supplier_ID: supplier.S_ID, Reference_No: 'BILL-001' } });
        if (!trans) {
            await SupplierTransaction.create({
                Supplier_ID: supplier.S_ID,
                Transaction_Date: new Date().toISOString().split('T')[0],
                Transaction_Type: 'Credit_Taken',
                Amount: 50000.00,
                Running_Balance: 50000.00,
                Reference_No: 'BILL-001',
                Notes: 'Initial stock purchase on credit'
            });
            console.log('Created dummy credit-taken transaction');
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

seed();
