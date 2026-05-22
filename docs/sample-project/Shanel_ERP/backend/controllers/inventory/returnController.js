const { ProductReturn, Inventory, Product } = require('../../models/index');
const sequelize = require('../../config/db');

// ⚠️ NOTE: We do NOT import Sales, SalesItem, Customer, UnitConversion models
// Instead, we query the database directly using raw SQL
// This ensures inventory module independence and stability

exports.processReturn = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { P_ID, Return_Type, Ref_ID, Total_Return_Qty, Good_Qty, Bad_Qty, Refund_Amount, Reason, Reason_Details } = req.body;

        // 1. Strict Validation
        if (parseFloat(Good_Qty) + parseFloat(Bad_Qty) !== parseFloat(Total_Return_Qty)) {
            throw new Error("Quantity mismatch: Good + Bad must equal Total Return Qty");
        }

        // 2. Get the location from the original sale
        let saleLocation = 'Shop'; // Default fallback
        if (Return_Type === 'Customer') {
            const sale = await sequelize.query(
                `SELECT Location FROM sales WHERE Sale_ID = ?`,
                {
                    replacements: [Ref_ID],
                    type: sequelize.QueryTypes.SELECT,
                    transaction: t
                }
            );
            if (sale && sale.length > 0 && sale[0].Location) {
                saleLocation = sale[0].Location;
            }
        }

        // 3. Handle Good Items (Restock = 1)
        if (parseFloat(Good_Qty) > 0) {
            await ProductReturn.create({
                P_ID, Return_Type, Ref_ID, Reason, Reason_Details,
                Qty: Good_Qty,
                Restock: 1, 
                Return_Date: new Date(),
                // Pro-rata refund calculation for this portion
                Refund_Amount: (Refund_Amount * (Good_Qty / Total_Return_Qty)).toFixed(2),
                Status: 'Completed'
            }, { transaction: t });

            // Update Physical Stock in the SAME location where it was sold
            const [inventory] = await Inventory.findOrCreate({
                where: { P_ID, Location: saleLocation },
                defaults: { Qty: 0 },
                transaction: t
            });
            await inventory.update({ Qty: parseFloat(inventory.Qty) + parseFloat(Good_Qty) }, { transaction: t });
        }

        // 4. Handle Bad Items (Restock = 0)
        if (parseFloat(Bad_Qty) > 0) {
            await ProductReturn.create({
                P_ID, Return_Type, Ref_ID, Reason, Reason_Details,
                Qty: Bad_Qty,
                Restock: 0, 
                Return_Date: new Date(),
                Refund_Amount: (Refund_Amount * (Bad_Qty / Total_Return_Qty)).toFixed(2),
                Status: 'Completed'
            }, { transaction: t });
            // Note: We do NOT update Inventory for restock = 0
        }

        await t.commit();
        res.status(201).json({ success: true, message: "Return processed successfully." });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getReturnLogs = async (req, res) => {
    try {
        // Query directly from database - no model imports or associations
        const returns = await sequelize.query(
            `SELECT pr.RT_ID, pr.P_ID, pr.Return_Type, pr.Ref_ID, pr.Qty, pr.Reason, 
                    pr.Reason_Details, pr.Return_Date, pr.Refund_Amount, pr.Restock, pr.Status,
                    p.P_Name, p.P_Name_Sinhala, p.P_Code, p.Base_Unit,
                    s.Sale_ID, s.Invoice_No, s.Sale_Date, s.Total_Amount,
                    c.C_ID, c.C_Name, c.Phone1, c.Email
             FROM product_return pr
             JOIN product p ON pr.P_ID = p.P_ID
             LEFT JOIN sales s ON pr.Ref_ID = s.Sale_ID
             LEFT JOIN customer c ON s.C_ID = c.C_ID
             ORDER BY pr.Created_At DESC`,
            {
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        res.json({ success: true, returns });
    } catch (error) {
        console.log('Get return logs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Search invoice by Invoice_No (e.g., "2026-001")
exports.searchInvoice = async (req, res) => {
    try {
        const { invoiceNo } = req.params;
        
        // Build full invoice number: INV-YYYY-NNN
        const fullInvoiceNo = `INV-${invoiceNo}`;
        
        // Query directly from database - no model imports
        // NOTE: sequelize.query returns an array directly, NOT wrapped in another array
        const sales = await sequelize.query(
            `SELECT s.Sale_ID, s.Invoice_No, s.C_ID, s.Sale_Date, s.Total_Amount,
                    c.C_Name, c.Phone1, c.Email
             FROM sales s
             LEFT JOIN customer c ON s.C_ID = c.C_ID
             WHERE s.Invoice_No = ?`,
            {
                replacements: [fullInvoiceNo],
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        if (!sales || sales.length === 0) {
            return res.status(404).json({ success: false, message: `Invoice ${fullInvoiceNo} not found` });
        }
        
        const sale = sales[0];
        
        res.json({ 
            success: true, 
            invoice: {
                Sale_ID: sale.Sale_ID,
                Invoice_No: sale.Invoice_No,
                Customer_ID: sale.C_ID,
                Customer_Name: sale.C_Name || 'Unknown',
                Sale_Date: sale.Sale_Date,
                Total_Amount: sale.Total_Amount
            }
        });
    } catch (error) {
        console.log('Search invoice error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get invoice details with items and product info
exports.getInvoiceDetails = async (req, res) => {
    try {
        const { saleId } = req.params;
        
        // Query directly from database - no model imports
        // NOTE: sequelize.query returns an array directly, NOT wrapped in another array
        const items = await sequelize.query(
            `SELECT si.Sale_Item_ID, si.Sale_ID, si.P_ID, si.U_ID, si.Quantity, 
                    si.Base_Unit_Qty, si.Unit_Price, si.Created_At,
                    p.P_Name, p.P_Name_Sinhala, p.Base_Unit, p.Retail_Price, p.Wholesale_Price,
                    uc.Unit_Name, uc.Unit_Conversion
             FROM sale_item si
             JOIN product p ON si.P_ID = p.P_ID
             LEFT JOIN unit_conversion uc ON si.U_ID = uc.U_ID
             WHERE si.Sale_ID = ?`,
            {
                replacements: [saleId],
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        if (!items || items.length === 0) {
            return res.status(404).json({ success: false, message: "No items found in this invoice" });
        }
        
        // Format items with base unit info
        const formattedItems = items.map(item => ({
            Sale_Item_Id: item.Sale_Item_ID,
            P_ID: item.P_ID,
            P_Name: item.P_Name,
            P_Name_Sinhala: item.P_Name_Sinhala,
            Base_Unit: item.Base_Unit,
            Quantity_Sold: item.Quantity,
            Base_Unit_Qty_Sold: item.Base_Unit_Qty,
            Unit_Price: item.Unit_Price,
            Sale_Date: item.Created_At,
            Unit_Name: item.Unit_Name,
            Unit_Conversion: item.Unit_Conversion
        }));
        
        res.json({ success: true, items: formattedItems });
    } catch (error) {
        console.log('Get invoice details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a return record
exports.updateReturn = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { RT_ID } = req.params;
        const { Qty, Reason, Reason_Details, Refund_Amount, Restock } = req.body;

        // Get the existing return record
        const existingReturn = await ProductReturn.findByPk(RT_ID, { transaction: t });
        if (!existingReturn) {
            return res.status(404).json({ success: false, message: 'Return record not found' });
        }

        const oldQty = parseFloat(existingReturn.Qty);
        const newQty = parseFloat(Qty);
        const P_ID = existingReturn.P_ID;
        const oldRestock = existingReturn.Restock;
        const Return_Type = existingReturn.Return_Type;
        const Ref_ID = existingReturn.Ref_ID;

        // Get the location from the original sale
        let saleLocation = 'Shop'; // Default fallback
        if (Return_Type === 'Customer') {
            const sale = await sequelize.query(
                `SELECT Location FROM sales WHERE Sale_ID = ?`,
                {
                    replacements: [Ref_ID],
                    type: sequelize.QueryTypes.SELECT,
                    transaction: t
                }
            );
            if (sale && sale.length > 0 && sale[0].Location) {
                saleLocation = sale[0].Location;
            }
        }

        // If quantity or restock status changed, update inventory
        if (oldQty !== newQty || oldRestock !== Restock) {
            const inventory = await Inventory.findOne({ 
                where: { P_ID, Location: saleLocation }, 
                transaction: t 
            });

            if (inventory) {
                let currentQty = parseFloat(inventory.Qty);

                // Reverse old effect
                if (oldRestock === 1) {
                    currentQty -= oldQty; // Remove the old good return
                }

                // Apply new effect
                if (Restock === 1) {
                    currentQty += newQty; // Add the new good return
                }

                // Never allow negative inventory
                currentQty = Math.max(0, currentQty);

                await inventory.update({ Qty: currentQty }, { transaction: t });
            }
        }

        // Update the return record
        await existingReturn.update({
            Qty: newQty,
            Reason,
            Reason_Details,
            Refund_Amount: parseFloat(Refund_Amount),
            Restock
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, message: 'Return updated successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Update return error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a return record
exports.deleteReturn = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { RT_ID } = req.params;

        // Get the return record to delete
        const returnRecord = await ProductReturn.findByPk(RT_ID, { transaction: t });
        if (!returnRecord) {
            return res.status(404).json({ success: false, message: 'Return record not found' });
        }

        const P_ID = returnRecord.P_ID;
        const qty = parseFloat(returnRecord.Qty);
        const Return_Type = returnRecord.Return_Type;
        const Ref_ID = returnRecord.Ref_ID;

        // If this was a good return (restocked), reverse the inventory update
        if (returnRecord.Restock === 1) {
            // Get the location from the original sale
            let saleLocation = 'Shop'; // Default fallback
            if (Return_Type === 'Customer') {
                const sale = await sequelize.query(
                    `SELECT Location FROM sales WHERE Sale_ID = ?`,
                    {
                        replacements: [Ref_ID],
                        type: sequelize.QueryTypes.SELECT,
                        transaction: t
                    }
                );
                if (sale && sale.length > 0 && sale[0].Location) {
                    saleLocation = sale[0].Location;
                }
            }

            const inventory = await Inventory.findOne({
                where: { P_ID, Location: saleLocation },
                transaction: t
            });

            if (inventory) {
                // Subtract the quantity that was added back
                const newQty = Math.max(0, parseFloat(inventory.Qty) - qty);
                await inventory.update({ Qty: newQty }, { transaction: t });
            }
        }

        // Delete the return record
        await returnRecord.destroy({ transaction: t });

        await t.commit();
        res.json({ success: true, message: 'Return deleted and inventory reversed' });
    } catch (error) {
        await t.rollback();
        console.error('Delete return error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};