const {Product, Inventory, Production} = require('../../models/index');
const sequelize = require('../../config/db');
const { Op } = require('sequelize');

const getSalesStockOverwiew = async (req, res) => {
    try{
        //1. Fetch only items located in the 'shop' (finished goods) with production details for expiry
        const shopStock = await Inventory.findAll({
            where: { Location: 'Shop'},
            include: [
                {
                    model: Product,
                    attributes: ['P_ID', 'P_Code', 'P_Name', 'P_Name_Sinhala', 'P_Type', 'Wholesale_Price', 'Min_Stock'],
                    where: { P_Type: { [Op.in]: ['Company', 'Other'] } },  // Only finished goods (Company + Non-Company), exclude Raw
                    required: true
                },
                {
                    model: Production,
                    attributes: ['PR_ID', 'Exp_Date', 'Batch_No', 'Status'],
                    required: false
                }
            ],
            raw: true,
            subQuery: false
        });

        //2. Get reserved quantities from sale_item table where sales are not completed/voided
        const reservedQtyRaw = await sequelize.query(`
            SELECT 
                si.P_ID,
                SUM(si.Base_Unit_Qty) as reserved_qty
            FROM sale_item si
            INNER JOIN sales s ON si.Sale_ID = s.Sale_ID
            WHERE 
                si.Status = 'Active' 
                AND s.Payment_Status IN ('Unpaid', 'Partially_Paid')
                AND s.Status = 'Active'
            GROUP BY si.P_ID
        `, { type: sequelize.QueryTypes.SELECT });

        // Create a map for quick lookup of reserved quantities
        const reservedMap = {};
        reservedQtyRaw.forEach(item => {
            reservedMap[item.P_ID] = parseFloat(item.reserved_qty || 0);
        });

        //3. Format table data 
        const tableData = shopStock.map(item => {
            const qty = parseFloat(item.Qty || 0);
            const price = parseFloat(item['Product.Wholesale_Price'] || 0);
            const productId = item['Product.P_ID'];
            const reservedQty = reservedMap[productId] || 0;
            const availableQty = Math.max(qty - reservedQty, 0);
            const expiryDate = item['Production.Exp_Date'] ? new Date(item['Production.Exp_Date']).toISOString().split('T')[0] : 'N/A';
            const batchNo = item['Production.Batch_No'] || 'N/A';

            return {
                code: item['Product.P_Code'],
                name: item['Product.P_Name'],
                nameSinhala: item['Product.P_Name_Sinhala'],
                type: item['Product.P_Type'],
                batchNo: batchNo,
                totalqty: qty,
                reserved: reservedQty, 
                available: availableQty,
                stockValue: qty * price,
                expiry: expiryDate,
                minStock: parseFloat(item['Product.Min_Stock'] || 0)
            } 
        });

        //4. Calculate summary metrics
        const metrics = {
            totalItems: tableData.length,
            availableUnits: tableData.reduce((sum, i) => sum + i.available, 0),
            totalValue: tableData.reduce((sum, i) => sum + i.stockValue, 0),
            totalReserved: tableData.reduce((sum, i) => sum + i.reserved, 0)
        };

        res.status(200).json({ success: true, tableData, metrics });
    } catch (error) {
        console.error("Sales Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getRecentStockIn = async (req, res) => {
    try {
        const stockInData = await sequelize.query(`
            SELECT 
                sm.SM_ID,
                p.P_Name,
                p.P_Name_Sinhala,
                p.P_Type,
                sm.Qty_In as quantity,
                sm.Movement_Type,
                sm.Move_Date,
                CASE 
                    WHEN sm.Movement_Type = 'Production' THEN 'Production'
                    WHEN sm.Movement_Type = 'Purchase' THEN 'Supplier'
                    WHEN sm.Movement_Type = 'Transfer_In' THEN 'Transfer'
                    ELSE sm.Movement_Type
                END as source
            FROM stock_movement sm
            INNER JOIN product p ON sm.P_ID = p.P_ID
            WHERE 
                sm.Location = 'Shop'
                AND sm.Movement_Type IN ('Production', 'Purchase', 'Transfer_In')
                AND sm.Qty_In > 0
                AND p.P_Type IN ('Company', 'Other')
            ORDER BY sm.Move_Date DESC
            LIMIT 10
        `, { type: sequelize.QueryTypes.SELECT });

        const formattedData = stockInData.map(item => ({
            id: item.SM_ID,
            productName: item.P_Name,
            productNameSinhala: item.P_Name_Sinhala,
            productType: item.P_Type,
            quantity: parseFloat(item.quantity || 0),
            source: item.source,
            date: new Date(item.Move_Date).toISOString().split('T')[0]
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Stock In Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getRecentStockOut = async (req, res) => {
    try {
        const stockOutData = await sequelize.query(`
            SELECT 
                sm.SM_ID,
                p.P_Name,
                p.P_Name_Sinhala,
                p.P_Type,
                sm.Qty_Out as quantity,
                sm.Movement_Type,
                sm.Move_Date,
                CASE 
                    WHEN sm.Movement_Type = 'Sale' THEN 'Sales'
                    WHEN sm.Movement_Type = 'Transfer_Out' THEN 'Transfer'
                    WHEN sm.Movement_Type = 'Damage' THEN 'Damage'
                    WHEN sm.Movement_Type = 'Expired' THEN 'Expired'
                    ELSE sm.Movement_Type
                END as destination
            FROM stock_movement sm
            INNER JOIN product p ON sm.P_ID = p.P_ID
            WHERE 
                sm.Location = 'Shop'
                AND sm.Movement_Type IN ('Sale', 'Transfer_Out', 'Damage', 'Expired')
                AND sm.Qty_Out > 0
                AND p.P_Type IN ('Company', 'Other')
            ORDER BY sm.Move_Date DESC
            LIMIT 10
        `, { type: sequelize.QueryTypes.SELECT });

        const formattedData = stockOutData.map(item => ({
            id: item.SM_ID,
            productName: item.P_Name,
            productNameSinhala: item.P_Name_Sinhala,
            productType: item.P_Type,
            quantity: parseFloat(item.quantity || 0),
            destination: item.destination,
            date: new Date(item.Move_Date).toISOString().split('T')[0]
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Stock Out Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {getSalesStockOverwiew, getRecentStockIn, getRecentStockOut};