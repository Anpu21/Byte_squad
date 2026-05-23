const { Production, Product, Inventory } = require('../../models/index');
const sequelize = require('../../config/db');

// 1. Get All Active WIP Batches
exports.getProductionData = async (req, res) => {
    try {
        const wipData = await Production.findAll({
            where: { Status: ['In_Progress', 'Quality_Check', 'Approved'] },
            include: [{ model: Product, attributes: ['P_Name', 'P_Name_Sinhala', 'Base_Unit'] }],
            order: [['Created_At', 'DESC']]
        });

        const formattedWip = wipData.map(item => {
            let completionVal = 0;
            if (item.Status === 'In_Progress') {
                // New batches remain at 0% until user explicitly marks them In Progress.
                const createdAt = item.Created_At ? new Date(item.Created_At) : null;
                const updatedAt = item.Updated_At ? new Date(item.Updated_At) : null;
                completionVal = (createdAt && updatedAt && updatedAt.getTime() > createdAt.getTime()) ? 50 : 0;
            } else if (item.Status === 'Quality_Check') {
                completionVal = 85;
            } else if (item.Status === 'Approved' || item.Status === 'Completed') {
                completionVal = 100;
            }

            // Calculate days to expiry
            let daysToExpire = null;
            if (item.Exp_Date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expDate = new Date(item.Exp_Date);
                expDate.setHours(0, 0, 0, 0);
                daysToExpire = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
            }

            return {
                PR_ID: item.PR_ID,
                P_ID: item.P_ID,
                Batch_No: item.Batch_No,
                P_Name: item.Product ? item.Product.P_Name : 'Unknown',
                P_Name_Sinhala: item.Product ? item.Product.P_Name_Sinhala : '',
                Base_Unit: item.Product ? item.Product.Base_Unit : '',
                Total_Qty_Produced: item.Total_Qty_Produced,
                Production_Date: item.Production_Date,
                Exp_Date: item.Exp_Date,
                Status: item.Status,
                Completion: completionVal,
                DaysToExpire: daysToExpire
            };
        });

        res.status(200).json({ success: true, wip: formattedWip });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Start New Production (Add WIP)
exports.startProduction = async (req, res) => {
    try {
        const { P_ID, Batch_No, Total_Qty_Produced, Production_Date, Exp_Date } = req.body;
        const newBatch = await Production.create({
            P_ID,
            Batch_No,
            Total_Qty_Produced,
            Production_Date,
            Exp_Date,
            Status: 'In_Progress'
        });
        res.status(201).json({ success: true, data: newBatch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Update Status (Progress) or Complete & Add to Stock
exports.updateProductionStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { status } = req.body;
        const batch = await Production.findByPk(id, { transaction: t });

        if (!batch) throw new Error("Batch not found");

        if (status === 'Approved' && batch.Status !== 'Approved') {
            // Fetch product to determine inventory location based on product type
            const product = await Product.findByPk(batch.P_ID, { transaction: t });
            if (!product) throw new Error("Product not found");

            // Determine location based on product type
            // Company items go to "Production", Others and Raw materials go to their respective locations
            const location = product.P_Type === 'Company' ? 'Production' : 'Shop';

            const [inventory] = await Inventory.findOrCreate({
                where: { P_ID: batch.P_ID, Location: location },
                defaults: { Qty: 0 },
                transaction: t
            });
            await inventory.update({ Qty: parseFloat(inventory.Qty) + parseFloat(batch.Total_Qty_Produced) }, { transaction: t });
        }

        if (status === 'In_Progress') {
            // Even when status is unchanged, bump Updated_At so UI can show 50%.
            await sequelize.query(
                'UPDATE production SET Status = ?, Updated_At = NOW() WHERE PR_ID = ?',
                { replacements: [status, id], transaction: t }
            );
        } else {
            await batch.update({ Status: status }, { transaction: t });
        }

        await t.commit();
        res.json({ success: true, message: "Production updated and Stock synced!" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Delete Batch
exports.deleteProduction = async (req, res) => {
    try {
        await Production.destroy({ where: { PR_ID: req.params.id } });
        res.json({ success: true, message: "Batch deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};