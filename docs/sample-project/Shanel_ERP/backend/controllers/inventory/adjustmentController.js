const { StockAdjustment,Product, Inventory } = require("../../models/index");
const sequelize = require('../../config/db');

exports.createAdjustment = async (req, res) => {
    const t = await sequelize.transaction();
    try{
        const { P_ID, Location, Adjustment_Qty, Adjustment_Type, Adjustment_Date, Reason} = req.body;

        //get current stock
        const inventory = await Inventory.findOne({ where: {P_ID, Location}, transaction: t});
        const systemQty = inventory ? parseFloat(inventory.Qty): 0;
        
        // Calculate new quantity based on adjustment type
        let newQty = systemQty;
        let difference = 0;

        if (Adjustment_Type === 'Stock_Take') {
            // For stock take, treat as inventory received
            newQty = systemQty + parseFloat(Adjustment_Qty);
            difference = parseFloat(Adjustment_Qty);
        } else if (['Damage', 'Expired', 'Theft', 'Other'].includes(Adjustment_Type)) {
            // For damage, expired, theft - reduce stock
            newQty = Math.max(0, systemQty - parseFloat(Adjustment_Qty));
            difference = -parseFloat(Adjustment_Qty);
        }

        //create adjustment record
        await StockAdjustment.create({
            P_ID,
            Location,
            System_Qty: systemQty,
            Physical_Qty: newQty,
            Difference: difference,
            Adjustment_Type,
            Reason,
            Adjustment_Date: Adjustment_Date || new Date(),
            Status: 'Approved',
        }, { transaction: t });

        //update the inventory table
        if(inventory){
            await inventory.update({ Qty: newQty }, { transaction: t });
        } else {
            await Inventory.create({ P_ID, Location, Qty: newQty }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ success: true, message: `Stock adjustment created successfully. Updated from ${systemQty} to ${newQty}` });

    } catch (error) {
        await t.rollback();
        console.error("Adjustment Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Error creating stock adjustment' });
    }
};

exports.getAdjustments = async (req, res) => {
    try {
        const logs = await StockAdjustment.findAll({
            include: [{ model: Product, attributes: ['P_Name', 'P_Name_Sinhala', 'P_Code']}],
            order: [['Adjustment_ID', 'DESC']]
        });
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching stock adjustments' });
    }
};

exports.updateAdjustment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { Adjustment_Qty, Adjustment_Type, Adjustment_Date, Reason } = req.body;
        const adjustmentId = req.params.id;

        // Find the adjustment to update
        const oldAdjustment = await StockAdjustment.findByPk(adjustmentId, { transaction: t });
        if (!oldAdjustment) {
            return res.status(404).json({ success: false, message: 'Adjustment not found' });
        }

        // Get current inventory
        const inventory = await Inventory.findOne({ 
            where: { P_ID: oldAdjustment.P_ID, Location: oldAdjustment.Location }, 
            transaction: t 
        });
        const currentQty = inventory ? parseFloat(inventory.Qty) : 0;

        // Reverse the old adjustment (undo it)
        let reversedQty = currentQty;
        if (['Damage', 'Expired', 'Theft', 'Other'].includes(oldAdjustment.Adjustment_Type)) {
            // Original was a reduction, so add it back
            reversedQty = currentQty + Math.abs(oldAdjustment.Difference);
        } else if (oldAdjustment.Adjustment_Type === 'Stock_Take') {
            // Original was an addition, so subtract it
            reversedQty = currentQty - oldAdjustment.Difference;
        }

        // Apply the new adjustment
        let newQty = reversedQty;
        let newDifference = 0;
        
        if (Adjustment_Type === 'Stock_Take') {
            newQty = reversedQty + parseFloat(Adjustment_Qty);
            newDifference = parseFloat(Adjustment_Qty);
        } else if (['Damage', 'Expired', 'Theft', 'Other'].includes(Adjustment_Type)) {
            newQty = Math.max(0, reversedQty - parseFloat(Adjustment_Qty));
            newDifference = -parseFloat(Adjustment_Qty);
        }

        // Update the adjustment record
        await oldAdjustment.update({
            Adjustment_Type,
            Difference: newDifference,
            Adjustment_Date,
            Reason,
            System_Qty: reversedQty,
            Physical_Qty: newQty
        }, { transaction: t });

        // Update inventory
        if (inventory) {
            await inventory.update({ Qty: newQty }, { transaction: t });
        } else {
            await Inventory.create({ P_ID: oldAdjustment.P_ID, Location: oldAdjustment.Location, Qty: newQty }, { transaction: t });
        }

        await t.commit();
        res.json({ success: true, message: 'Adjustment updated successfully' });

    } catch (error) {
        await t.rollback();
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Error updating adjustment' });
    }
};

exports.deleteAdjustment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const adjustmentId = req.params.id;

        // Find the adjustment to delete
        const adjustment = await StockAdjustment.findByPk(adjustmentId, { transaction: t });
        if (!adjustment) {
            return res.status(404).json({ success: false, message: 'Adjustment not found' });
        }

        // Get current inventory
        const inventory = await Inventory.findOne({ 
            where: { P_ID: adjustment.P_ID, Location: adjustment.Location }, 
            transaction: t 
        });
        const currentQty = inventory ? parseFloat(inventory.Qty) : 0;

        // Reverse the adjustment (undo it)
        let reversedQty = currentQty;
        if (['Damage', 'Expired', 'Theft', 'Other'].includes(adjustment.Adjustment_Type)) {
            // Original was a reduction, so add it back
            reversedQty = currentQty + Math.abs(adjustment.Difference);
        } else if (adjustment.Adjustment_Type === 'Stock_Take') {
            // Original was an addition, so subtract it
            reversedQty = currentQty - adjustment.Difference;
        }

        // Delete the adjustment
        await adjustment.destroy({ transaction: t });

        // Update inventory to reflect reversal
        if (inventory) {
            await inventory.update({ Qty: reversedQty }, { transaction: t });
        }

        await t.commit();
        res.json({ success: true, message: 'Adjustment deleted and stock reversed' });

    } catch (error) {
        await t.rollback();
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Error deleting adjustment' });
    }
};
