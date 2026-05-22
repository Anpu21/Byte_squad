const { StockTransfer, Product, Inventory } = require('../../models/index');
const sequelize = require('../../config/db');

const getTransferHistory = async (req, res) => {
    try {
        let transfers = [];
        let metrics = {
            totalTransfers: 0,
            pending: 0,
            completedToday: 0,
            totalItems: 0
        };

        // Try to fetch from database, but gracefully handle if table doesn't exist
        try {
            transfers = await StockTransfer.findAll({
                order: [['Created_At', 'DESC'], ['Transfer_Date', 'DESC']],
            });

            metrics = {
                totalTransfers: transfers.length,
                pending: transfers.filter(t => t.Status === 'Pending').length,
                completedToday: transfers.filter(t => t.Status === 'Completed').length,
                totalItems: transfers.reduce((sum, t) => sum + (parseFloat(t.Qty) || 0), 0)
            };
        } catch (dbError) {
            console.error('Database Query Error:', dbError.message);
            // Return empty data structure if table doesn't exist yet
            transfers = [];
        }

        res.json({ success: true, transfers, metrics });
    } catch (error) {
        console.error('Transfer History Error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch transfer history' });
    }
};

const createTransfer = async (req, res) => {
    const { P_ID, Qty, From_Location, To_Location, Transferred_By } = req.body;
    
    // Validate required fields
    if (!P_ID || !Qty || !From_Location || !To_Location) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const t = await sequelize.transaction();

    try {
        console.log(`\n========== TRANSFER START ==========`);
        console.log(`Transfer Request: Product ${P_ID}, Qty: ${Qty}, From: ${From_Location}, To: ${To_Location}`);

        // 1. Check if source has enough stock by aggregating all inventory records for that location
        const sourceStocks = await Inventory.findAll({
            where: { P_ID, Location: From_Location, PR_ID: null },
            transaction: t
        });

        console.log(`Found ${sourceStocks.length} inventory records for Product ${P_ID} at ${From_Location}`);
        sourceStocks.forEach((stock, idx) => {
            console.log(`  Record ${idx}: INV_ID=${stock.INV_ID}, PR_ID=${stock.PR_ID}, Qty=${stock.Qty}`);
        });

        const totalSourceQty = sourceStocks.reduce((sum, inv) => sum + parseFloat(inv.Qty || 0), 0);
        console.log(`Total available at ${From_Location}: ${totalSourceQty}, Requesting: ${Qty}`);

        if (totalSourceQty < parseFloat(Qty)) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient stock in ${From_Location}. Available: ${totalSourceQty}, Requested: ${Qty}` 
            });
        }

        // 2. Subtract from Source - deduct from first record (or multiple if needed)
        let qtyToDeduct = parseFloat(Qty);
        for (const sourceStock of sourceStocks) {
            if (qtyToDeduct <= 0) break;
            
            const deductAmount = Math.min(qtyToDeduct, parseFloat(sourceStock.Qty));
            const newQty = parseFloat(sourceStock.Qty) - deductAmount;
            
            console.log(`Reducing stock INV_ID ${sourceStock.INV_ID}: ${sourceStock.Qty} - ${deductAmount} = ${newQty}`);
            sourceStock.Qty = newQty;
            await sourceStock.save({ transaction: t });
            
            qtyToDeduct -= deductAmount;
        }

        // 3. Add to Destination
        let destStock = await Inventory.findOne({
            where: { P_ID, Location: To_Location, PR_ID: null },
            transaction: t
        });

        if (!destStock) {
            console.log(`Creating new inventory record for Product ${P_ID} at ${To_Location}`);
            destStock = await Inventory.create({
                P_ID,
                Location: To_Location,
                PR_ID: null,
                Qty: 0
            }, { transaction: t });
        }

        const oldDestQty = parseFloat(destStock.Qty);
        const newDestQty = oldDestQty + parseFloat(Qty);
        console.log(`Adding to destination ${To_Location}: INV_ID ${destStock.INV_ID}, ${oldDestQty} + ${Qty} = ${newDestQty}`);
        destStock.Qty = newDestQty;
        await destStock.save({ transaction: t });

        // 4. Record the Transfer History
        const newTransfer = await StockTransfer.create({
            P_ID,
            Qty: parseFloat(Qty),
            From_Location,
            To_Location,
            Transferred_By,
            Status: 'Completed',
            Transfer_Date: new Date().toISOString().split('T')[0]
        }, { transaction: t });

        await t.commit();
        console.log(`✓ Transfer completed successfully - ID: ${newTransfer.ST_ID}`);
        console.log(`========== TRANSFER END ==========\n`);
        res.status(201).json({ success: true, message: "Transfer successful!", data: newTransfer });

    } catch (error) {
        await t.rollback();
        console.error(`✗ Transfer Error: ${error.message}`, error);
        console.log(`========== TRANSFER FAILED ==========\n`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateTransfer = async (req, res) => {
    const { ST_ID } = req.params;
    const { P_ID, Qty, From_Location, To_Location, Transferred_By } = req.body;
    
    if (!ST_ID || !P_ID || !Qty || !From_Location || !To_Location) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const t = await sequelize.transaction();

    try {
        console.log(`\n========== UPDATE TRANSFER START ==========`);
        console.log(`Update Transfer Request: ST_ID ${ST_ID}, Product ${P_ID}, Qty: ${Qty}`);

        // 1. Find the existing transfer
        const existingTransfer = await StockTransfer.findByPk(ST_ID, { transaction: t });
        if (!existingTransfer) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        const oldQty = parseFloat(existingTransfer.Qty);
        const newQty = parseFloat(Qty);

        console.log(`Old Transfer: ${existingTransfer.From_Location}→${existingTransfer.To_Location}, Qty: ${oldQty}`);
        console.log(`New Transfer: ${From_Location}→${To_Location}, Qty: ${newQty}`);

        // 2. Revert the old transfer first
        const oldSourceStocks = await Inventory.findAll({
            where: { P_ID: existingTransfer.P_ID, Location: existingTransfer.From_Location, PR_ID: null },
            transaction: t
        });

        console.log(`Reverting from ${existingTransfer.From_Location}: found ${oldSourceStocks.length} records`);
        for (const oldSourceStock of oldSourceStocks) {
            const revertedQty = parseFloat(oldSourceStock.Qty) + oldQty;
            console.log(`  Restoring INV_ID ${oldSourceStock.INV_ID}: ${oldSourceStock.Qty} + ${oldQty} = ${revertedQty}`);
            oldSourceStock.Qty = revertedQty;
            await oldSourceStock.save({ transaction: t });
        }

        const oldDestStocks = await Inventory.findAll({
            where: { P_ID: existingTransfer.P_ID, Location: existingTransfer.To_Location, PR_ID: null },
            transaction: t
        });

        console.log(`Reverting from ${existingTransfer.To_Location}: found ${oldDestStocks.length} records`);
        for (const oldDestStock of oldDestStocks) {
            const revertedQty = parseFloat(oldDestStock.Qty) - oldQty;
            console.log(`  Restoring INV_ID ${oldDestStock.INV_ID}: ${oldDestStock.Qty} - ${oldQty} = ${revertedQty}`);
            oldDestStock.Qty = revertedQty;
            await oldDestStock.save({ transaction: t });
        }

        // 3. Apply the new transfer - check if source has enough stock
        const sourceStocks = await Inventory.findAll({
            where: { P_ID, Location: From_Location, PR_ID: null },
            transaction: t
        });

        console.log(`New transfer - finding source at ${From_Location}: found ${sourceStocks.length} records`);
        const totalSourceQty = sourceStocks.reduce((sum, inv) => sum + parseFloat(inv.Qty || 0), 0);
        console.log(`Total available: ${totalSourceQty}, Requesting: ${newQty}`);

        if (totalSourceQty < newQty) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient stock in ${From_Location}. Available: ${totalSourceQty}, Requested: ${newQty}` 
            });
        }

        let qtyToDeduct = newQty;
        for (const sourceStock of sourceStocks) {
            if (qtyToDeduct <= 0) break;
            
            const deductAmount = Math.min(qtyToDeduct, parseFloat(sourceStock.Qty));
            const newSourceQty = parseFloat(sourceStock.Qty) - deductAmount;
            
            console.log(`  Reducing INV_ID ${sourceStock.INV_ID}: ${sourceStock.Qty} - ${deductAmount} = ${newSourceQty}`);
            sourceStock.Qty = newSourceQty;
            await sourceStock.save({ transaction: t });
            
            qtyToDeduct -= deductAmount;
        }

        let destStock = await Inventory.findOne({
            where: { P_ID, Location: To_Location, PR_ID: null },
            transaction: t
        });

        if (!destStock) {
            console.log(`Creating new destination record at ${To_Location}`);
            destStock = await Inventory.create({
                P_ID,
                Location: To_Location,
                PR_ID: null,
                Qty: 0
            }, { transaction: t });
        }

        const oldDestQty = parseFloat(destStock.Qty);
        const newDestQty = oldDestQty + newQty;
        console.log(`Updating destination INV_ID ${destStock.INV_ID}: ${oldDestQty} + ${newQty} = ${newDestQty}`);
        destStock.Qty = newDestQty;
        await destStock.save({ transaction: t });

        // 4. Update the transfer record
        await existingTransfer.update({
            P_ID,
            Qty: newQty,
            From_Location,
            To_Location,
            Transferred_By
        }, { transaction: t });

        await t.commit();
        console.log(`✓ Transfer updated successfully`);
        console.log(`========== UPDATE TRANSFER END ==========\n`);
        res.status(200).json({ success: true, message: "Transfer updated successfully!", data: existingTransfer });

    } catch (error) {
        await t.rollback();
        console.error(`✗ Update Transfer Error: ${error.message}`, error);
        console.log(`========== UPDATE TRANSFER FAILED ==========\n`);
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = { getTransferHistory, createTransfer, updateTransfer };