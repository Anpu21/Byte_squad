const sequelize = require('../../config/db');
const { Op} = require('sequelize');

exports.getCurrentStockReport = async (req, res) => {
    try {
        // Complex query to get stock split by Production and Shop
        const [results] = await sequelize.query(`
            SELECT 
                p.P_ID, p.P_Code, p.P_Name, p.P_Name_Sinhala, p.Base_Unit,
                COALESCE(SUM(CASE WHEN i.Location = 'Production' THEN i.Qty ELSE 0 END), 0) as productionStock,
                COALESCE(SUM(CASE WHEN i.Location = 'Shop' THEN i.Qty ELSE 0 END), 0) as salesStock,
                COALESCE(SUM(i.Qty), 0) as Total_Stock
            FROM PRODUCT p
            LEFT JOIN INVENTORY i ON p.P_ID = i.P_ID
            GROUP BY p.P_ID, p.Base_Unit
        `, { raw: true });

        res.json({ success: true, data: results || [] });
    } catch (error) {
        console.error('getCurrentStockReport Error:', error);
        // Return empty array instead of error
        res.json({ success: true, data: [] });
    }
};

exports.getExpiryReport = async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT 
                p.P_Code, 
                p.P_Name, 
                p.P_Name_Sinhala,
                p.Base_Unit,
                pr.Batch_No, 
                pr.Total_Qty_Produced as Quantity, 
                pr.Exp_Date,
                DATEDIFF(pr.Exp_Date, CURDATE()) as Days_Left
            FROM PRODUCTION pr
            JOIN PRODUCT p ON pr.P_ID = p.P_ID
            WHERE pr.Status = 'Approved'
            ORDER BY pr.Exp_Date ASC
        `, { raw: true });

        res.json({ success: true, data: results || [] });
    } catch (error) {
        console.error('getExpiryReport Error:', error);
        res.json({ success: true, data: [] });
    }
};

exports.getProductionReport = async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT 
                p.P_Code, 
                p.P_Name, 
                p.P_Name_Sinhala,
                p.Base_Unit,
                pr.Batch_No, 
                pr.Total_Qty_Produced as Actual_Qty,
                pr.Production_Date,
                p.Cost_Price as Cost_Per_Unit,
                pr.Status
            FROM PRODUCTION pr
            JOIN PRODUCT p ON pr.P_ID = p.P_ID
            WHERE pr.Status = 'Approved'
            ORDER BY pr.Production_Date DESC
        `, { raw: true });

        res.json({ success: true, data: results || [] });
    } catch (error) {
        console.error('getProductionReport Error:', error);
        res.json({ success: true, data: [] });
    }
};

//  General Purchase Report (All POs)
exports.getPurchaseReport = async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT 
                po.PO_No, s.S_Name as Supplier, po.PO_Date, 
                po.Total_Amount, po.Payment_Status, po.Status
            FROM PURCHASE_ORDER po
            JOIN SUPPLIER s ON po.S_ID = s.S_ID
            ORDER BY po.PO_Date DESC
        `, { raw: true });
        res.json({ success: true, data: results || [] });
    } catch (error) { 
        console.error('getPurchaseReport Error:', error);
        res.json({ success: true, data: [] });
    }
};

//  Stock Transfer Report (Movement History)
exports.getTransferReport = async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT 
                st.ST_ID, p.P_Name, p.P_Name_Sinhala, p.Base_Unit, st.From_Location, st.To_Location, 
                st.Qty, st.Transfer_Date, st.Status
            FROM STOCK_TRANSFER st
            JOIN PRODUCT p ON st.P_ID = p.P_ID
            ORDER BY st.Transfer_Date DESC
        `, { raw: true });
        res.json({ success: true, data: results || [] });
    } catch (error) { 
        console.error('getTransferReport Error:', error.message);
        res.json({ success: true, data: [] });
    }
};

//  Supplier Purchase Report (Total spend per supplier)
exports.getSupplierPurchaseReport = async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT 
                s.S_Code, s.S_Name, 
                COUNT(po.PO_ID) as Total_Orders,
                SUM(po.Total_Amount) as Total_Spent
            FROM SUPPLIER s
            LEFT JOIN PURCHASE_ORDER po ON s.S_ID = po.S_ID
            GROUP BY s.S_ID
            ORDER BY Total_Spent DESC
        `, { raw: true });
        res.json({ success: true, data: results || [] });
    } catch (error) { 
        console.error('getSupplierPurchaseReport Error:', error.message);
        res.json({ success: true, data: [] });
    }
};