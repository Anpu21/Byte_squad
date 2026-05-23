const { Product, Inventory, Production, UnitConversion, StockTransfer, Supplier } = require('../../models/index');
const sequelize = require('../../config/db');
const { Op } = require('sequelize');              //Used for SQL operators.

//Converts empty values into null
const emptyToNull = (value) => {  
    if (value === undefined || value === null || value === '' || value === 'null') {
        return null;
    }
    return value;
};

//Converts text into decimal number.(required fields)
const toRequiredFloat = (value, fallback = 0) => {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;  //If value is not a number, return fallback. it means 0
};

//for optinal decimal values
const toOptionalFloat = (value) => {
    const normalized = emptyToNull(value);  //First converts empty values to null.
    if (normalized === null) {
        return null;
    }

    const parsed = parseFloat(normalized);  //Convert to decimal number.
    return Number.isNaN(parsed) ? null : parsed;
};

//converts different true values into JavaScript true.
const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

//unit conversions of a product.
const syncProductUnits = async (productId, baseUnit, units, transaction) => {
    const desiredUnits = [
        //Adds base unit first.
        {
            unitName: baseUnit,
            conversionRate: 1,
            isBaseUnit: true
        },
        ...(Array.isArray(units) ? units : []).map(unit => ({
            //Creates alternative unit objects.
            id: unit.id,
            unitName: unit.unitName,
            conversionRate: unit.conversionRate,
            isBaseUnit: false
        }))
    ].filter(unit => unit.unitName && toRequiredFloat(unit.conversionRate, NaN) > 0);

    //Gets already saved units for that product from database.
    const existingUnits = await UnitConversion.findAll({
        where: { P_ID: productId },
        transaction
    });

    //Fast search by unit ID.
    const existingById = new Map(existingUnits.map(unit => [String(unit.U_ID), unit]));   //{ U_ID: 2, Unit_Name: "Card" }
    //Fast search by name
    const existingByName = new Map(existingUnits.map(unit => [unit.Unit_Name.toLowerCase(), unit]));
    //Stores unit IDs that were updated or created.
    const touchedIds = new Set();       

    for (const unit of desiredUnits) {
        const matchById = unit.id ? existingById.get(String(unit.id)) : null;  //Checks if unit already exists by ID.
        const matchByName = existingByName.get(unit.unitName.toLowerCase());    //Checks if unit already exists by name.
        const existing = matchById || matchByName;  //If found by ID or name, use that existing record.

        //Prepares unit data for database.
        const unitData = {
            Unit_Name: unit.unitName,
            Unit_Conversion: toRequiredFloat(unit.conversionRate, 1),
            Is_Base_Unit: unit.isBaseUnit
        };

        //If unit exists, update it. If not, create new unit.
        if (existing) {
            await existing.update(unitData, { transaction });
            touchedIds.add(existing.U_ID);
        } else {
            const created = await UnitConversion.create({
                P_ID: productId,
                ...unitData         //... spread operator to copy all properties from unitData into this object
            }, { transaction });
            touchedIds.add(created.U_ID);
        }
    }

    //Finds old units that are no longer needed. Deletes them if they are not used 
    const staleUnits = existingUnits.filter(unit => !touchedIds.has(unit.U_ID));
    for (const unit of staleUnits) {
        try {
            await unit.destroy({ transaction });
        } catch (err) {
            console.warn(`Could not delete unit ${unit.U_ID} for product ${productId}; it may be used by another record. Keeping it.`);
        }
    }
};

// 1. Get Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        // --- 1. STOCK LEVELS (For Bar Chart) - TOP 15 CRITICAL ITEMS ---
        // Show only top 15 products (critical/low stock) instead of all products
        // This prevents chart overcrowding and focuses on actionable items
        const stockLevelData = await Product.findAll({
            attributes: [
                ['P_Name', 'name'], 
                ['P_Name_Sinhala', 'nameSinhala'],
                ['Min_Stock', 'min'],
                ['P_ID', 'productId'],
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('inventories.Qty')), 0), 'current']  //calculates total stock for each product
            ],
            include: [{
                model: Inventory,
                as: 'inventories',
                attributes: [],
                required: false  //product still appears even if no inventory exists.
            }],
            group: ['Product.P_ID'],  //Groups stock by product
            where: {
                Min_Stock: { [Op.gt]: 0 } // Only include products that have a min stock defined
            },
            order: [
                // Prioritize products closest to or below minimum stock (current stock - minimum stock)
                [sequelize.literal('(COALESCE(SUM(inventories.Qty), 0) - Min_Stock)'), 'ASC']
            ],
            limit: 15, // Show only top 15 most critical items
            subQuery: false,
            raw: true  //return plain javascript object
        });

        // --- 2. LOW STOCK ALERTS ---
        // Logic: Find products where Total Inventory <= Min_Stock
        // gets inventory quantity and supplier details.
        const products = await Product.findAll({
            attributes: ['P_Name', 'P_Name_Sinhala', 'Min_Stock', 'P_Type', 'Base_Unit'],
            include: [
                { model: Inventory, as: 'inventories', attributes: ['Qty'] },
                { model: Supplier, as: 'supplier', attributes: ['S_Name', 'Phone_No', 'Email'], required: false }
            ]
        });

        const alerts = [];
        // Loops each product
        products.forEach(p => {
            //Calculates total stock.
            const total = p.inventories.reduce((sum, inv) => sum + parseFloat(inv.Qty), 0); 
            //If current stock is less than or equal minimum stock, create alert.
            if (total <= parseFloat(p.Min_Stock) && p.Min_Stock > 0) {
                alerts.push({
                    name: p.P_Name,
                    nameSinhala: p.P_Name_Sinhala,
                    type: p.P_Type,
                    current: total,
                    min: p.Min_Stock,
                    baseUnit: p.Base_Unit,
                    supplierName: p.supplier ? p.supplier.S_Name : null,
                    supplierPhone: p.supplier ? p.supplier.Phone_No : null,
                    supplierEmail: p.supplier ? p.supplier.Email : null
                });
            }
        });

        // --- 3. DISTRIBUTION BY TYPE (pie chart) ---
        const distributionRows = await Product.findAll({
            attributes: [['P_Type', 'name'], [sequelize.fn('COUNT', sequelize.col('P_ID')), 'value']],
            group: ['P_Type'],  //Gets product count by type.
            raw: true
        });

        //Formats result for frontend chart.
        const distribution = distributionRows.map(row => ({
            name: row.name || 'Unknown',
            value: Number(row.value) || 0
        })).filter(row => row.value > 0);

        // --- 4. RECENT TRANSFERS  (Latest 5 transfers only).---
        const transfers = await StockTransfer.findAll({
            attributes: ['ST_ID', 'P_ID', 'From_Location', 'To_Location', 'Qty', 'Transfer_Date', 'Status'],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['P_Name', 'P_Name_Sinhala']
            }],
            order: [['Transfer_Date', 'DESC']],
            limit: 5
        }); 

        // --- 5. SUMMARY Cards ---
        const companyItems = await Product.count({ where: { P_Type: 'Company' } });
        const otherItems = await Product.count({ where: { P_Type: 'Other' } });
        const productionStock = await Inventory.sum('Qty', { where: { Location: 'Production' } }) || 0;
        const salesStock = await Inventory.sum('Qty', { where: { Location: 'Shop' } }) || 0;
        const alertsCount = alerts.length;

        // --- FINAL RESPONSE-- Sends all dashboard data to frontend. ---
        res.json({
            success: true,
            stockLevel: stockLevelData,
            distribution,
            alerts: alerts, // Return all alerts so alerts page can show full list
            transfers: transfers,
            summary: {
                companyItems,
                otherItems,
                productionStock,
                salesStock,
                alertsCount
            }
        });
    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 1.5 Get All Stock Levels with Pagination & Filtering
const getAllStockLevels = async (req, res) => {
    try {
        // Query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sortBy = req.query.sortBy || 'gap'; // 'gap', 'stock', 'name'
        const filterType = req.query.type; // filter by product type
        const offset = (page - 1) * limit;

        // Build where clause -- Only products with minimum stock.
        const whereClause = {
            Min_Stock: { [Op.gt]: 0 }
        };
        if (filterType) {
            whereClause.P_Type = filterType;
        }

        // Counts total matching records.
        const totalCount = await Product.count({ where: whereClause });

        // Sort mapping
        const sortMap = {
            'gap': [sequelize.literal('(COALESCE(SUM(inventories.Qty), 0) - Min_Stock)'), 'ASC'],
            'stock': [sequelize.literal('COALESCE(SUM(inventories.Qty), 0)'), 'ASC'],
            'name': [['P_Name', 'ASC']]
        };

        // Fetch paginated results -- Gets stock level data from database.
        const stockLevels = await Product.findAll({
            attributes: [
                ['P_ID', 'productId'],
                ['P_Name', 'name'], 
                ['P_Name_Sinhala', 'nameSinhala'],
                ['P_Code', 'code'],
                ['P_Type', 'type'],
                ['Min_Stock', 'minStock'],
                ['Max_Stock', 'maxStock'],
                ['Status', 'status'],
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('inventories.Qty')), 0), 'currentStock']
            ],
            include: [{
                model: Inventory,
                as: 'inventories',
                attributes: [],
                required: false
            }],
            where: whereClause,
            group: ['Product.P_ID'],
            order: [sortMap[sortBy] || sortMap['gap']],
            limit: limit,
            offset: offset,
            subQuery: false,
            raw: true
        });

        // Sends data and pagination info to frontend
        res.json({
            success: true,
            data: stockLevels,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                pageSize: limit,
                totalRecords: totalCount
            }
        });
    } catch (err) {
        console.error("Get All Stock Levels Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Fetch All Products (with joined Stock Count)
const getProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            attributes: [
                ['P_ID', 'id'],   //database- P_ID , frontend - id
                ['P_Code', 'code'],
                ['P_Name', 'name'],
                ['P_Name_Sinhala', 'nameSinhala'],
                ['P_Type', 'type'], 
                ['Base_Unit', 'baseUnit'],
                ['Barcode', 'barcode'],
                ['Barcode_Type', 'barcodeType'],
                ['Cost_Price', 'costPrice'],
                ['Wholesale_Price', 'wholesalePrice'],
                ['Retail_Price', 'retailPrice'],
                ['Tax_Rate', 'taxRate'],
                ['Min_Stock', 'minStock'],
                ['Max_Stock', 'maxStock'],
                ['Reorder_Level', 'reorderLevel'],
                ['Category', 'category'],
                ['Subcategory', 'subcategory'],
                ['Description', 'description'],
                ['Image_Path', 'imagePath'],
                ['Weight', 'weight'],
                ['Weight_Unit', 'weightUnit'],
                ['Auto_Generate_Barcode', 'autoGenerateBarcode'],
                ['Is_Ishara_Product', 'isIsharaProduct'],
                ['Created_By', 'createdBy'],
                ['S_ID', 'supplierId'],
                ['Status', 'status'],
                ['Created_At', 'createdAt'],
                ['Updated_At', 'updatedAt'],
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('inventories.Qty')), 0), 'stockCount']
            ],
            include: [{
                model: Inventory,  //join inventry table to get stock count
                as: 'inventories',
                attributes: [],
                required: false
            }],
            group: ['Product.P_ID'],
            raw: true
        });
        
        // For each product, get unit conversions
        const productsWithUnits = await Promise.all(
            products.map(async (product) => {
                const units = await UnitConversion.findAll({
                    attributes: [
                        ['U_ID', 'id'],
                        ['Unit_Name', 'unitName'],
                        ['Unit_Conversion', 'conversionRate'],
                        ['Is_Base_Unit', 'isBaseUnit']
                    ],
                    where: { P_ID: product.id },
                    raw: true
                });
                return { ...product, units };  //Adds units into product object
            })
        );
        
        res.json(productsWithUnits);
    } catch (err) {
        console.error("Get Products Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. Add a new Product
const addProduct = async (req, res) => {
    try {
        // Debug log
        console.log("AddProduct Request Body:", req.body);
        console.log("Barcode value:", req.body.barcode);
        console.log("File received:", req.file);

        // Parse units if it's a string (from FormData)
        let units = [];
        if (req.body.units) {
            try {
                //If units come as text, put it into array
                units = typeof req.body.units === 'string' ? JSON.parse(req.body.units) : req.body.units;
            } catch (e) {
                console.error("Error parsing units:", e);
                units = [];
            }
        }

        //Converts Ishara product value to boolean
        const isIsharaProduct = toBoolean(req.body.isIsharaProduct);

        // Transform camelCase field names to database column names
        const productData = {
            P_Code: req.body.code,
            P_Name: req.body.name,
            P_Name_Sinhala: req.body.nameSinhala,
            P_Type: req.body.type,
            Base_Unit: req.body.baseUnit,
            Cost_Price: parseFloat(req.body.costPrice) || 0,
            Retail_Price: parseFloat(req.body.retailPrice) || 0,
            Wholesale_Price: parseFloat(req.body.wholesalePrice) || 0,
            Min_Stock: parseFloat(req.body.minStock) || 0,
            Max_Stock: parseFloat(req.body.maxStock) || null,
            Reorder_Level: parseFloat(req.body.reorderLevel) || null,
            Tax_Rate: parseFloat(req.body.taxRate) || 0,
            Category: req.body.category,
            Subcategory: req.body.subcategory,
            Description: req.body.description,
            Image_Path: req.file ? `/uploads/${req.file.filename}` : req.body.imagePath,
            Weight: parseFloat(req.body.weight) || null,
            Weight_Unit: req.body.weightUnit,
            Barcode: req.body.barcode,
            Barcode_Type: req.body.barcodeType,
            Auto_Generate_Barcode: req.body.autoGenerateBarcode === 'true' || req.body.autoGenerateBarcode === true,
            Is_Ishara_Product: isIsharaProduct,
            Created_By: req.body.createdBy,
            S_ID: req.body.supplierId ? parseInt(req.body.supplierId) : null,
            // Status will default to "In Stock" as per model definition
        };

        //Creates product in database
        const newProduct = await Product.create(productData);  
        
        // Create base unit record
        await UnitConversion.create({
            P_ID: newProduct.P_ID,
            Unit_Name: req.body.baseUnit,
            Unit_Conversion: 1.0,
            Is_Base_Unit: true
        });
        
        // Handle alternative unit conversions if provided
        if (Array.isArray(units) && units.length > 0) {
            //Creates all alternative units.
            const unitPromises = units.map(unit => 
                UnitConversion.create({
                    P_ID: newProduct.P_ID,
                    Unit_Name: unit.unitName,
                    Unit_Conversion: parseFloat(unit.conversionRate),
                    Is_Base_Unit: false
                })
            );
            await Promise.all(unitPromises);  //Waits until all units are saved.
        }

        // Create inventory entry if initial quantity provided (for supplier items and Ishara products)
        const initialQty = parseFloat(req.body.initialQty) || 0;
        
        let inventoryLocation = null;
        // Determine inventory location based on product type
        if (req.body.type === 'Other') {
            inventoryLocation = 'Shop';
        } else if (req.body.type === 'Raw') {
            inventoryLocation = 'Production';
        } else if (req.body.type === 'Company' && isIsharaProduct) {
            // Ishara products (Company items that skip production)
            inventoryLocation = 'Shop';
        }
        
        //If location exists and quantity is greater than 0. Create inventory record for that location.
        if (inventoryLocation && initialQty > 0) {
            await Inventory.create({
                P_ID: newProduct.P_ID,
                Location: inventoryLocation,
                Qty: initialQty,
                Last_Updated: new Date()
            });
            console.log(`✓ Created inventory entry for product ${newProduct.P_ID} with quantity ${initialQty} at location ${inventoryLocation}`);
        }
        
        res.status(201).json({ success: true, message: "Product created!", data: newProduct });
    } catch (err) {
        res.status(500).json({ success: false, message: "Creation failed", error: err.message });
    }
};

// 4. Update Product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;  //Gets product ID from URL.
        
        console.log("📝 Update Product Request - ID:", id);
        console.log("📝 Request Body:", {
            code: req.body.code,
            name: req.body.name,
            type: req.body.type,
            baseUnit: req.body.baseUnit,
            costPrice: req.body.costPrice,
            retailPrice: req.body.retailPrice,
            wholesalePrice: req.body.wholesalePrice,
            isIsharaProduct: req.body.isIsharaProduct
        });
        
        // Parse units if it's a string (from FormData)
        let units = [];
        if (req.body.units) {
            try {
                units = typeof req.body.units === 'string' ? JSON.parse(req.body.units) : req.body.units;
            } catch (e) {
                console.error("Error parsing units:", e);
                units = [];
            }
        }
        
        const isIsharaProduct = toBoolean(req.body.isIsharaProduct);

        // Transform camelCase field names to database column names
        const updateData = {
            P_Code: emptyToNull(req.body.code),  //If code is empty, save null.
            P_Name: req.body.name,
            P_Name_Sinhala: emptyToNull(req.body.nameSinhala),
            P_Type: req.body.type,
            Base_Unit: req.body.baseUnit,
            Cost_Price: toRequiredFloat(req.body.costPrice),
            Retail_Price: toRequiredFloat(req.body.retailPrice),
            Wholesale_Price: toRequiredFloat(req.body.wholesalePrice),
            Min_Stock: toRequiredFloat(req.body.minStock),
            Max_Stock: toOptionalFloat(req.body.maxStock),
            Reorder_Level: toOptionalFloat(req.body.reorderLevel),
            Tax_Rate: toRequiredFloat(req.body.taxRate),
            Category: emptyToNull(req.body.category),
            Subcategory: emptyToNull(req.body.subcategory),
            Description: emptyToNull(req.body.description),
            Image_Path: req.file ? `/uploads/${req.file.filename}` : emptyToNull(req.body.imagePath),
            Weight: toOptionalFloat(req.body.weight),
            Weight_Unit: emptyToNull(req.body.weightUnit),
            Barcode: emptyToNull(req.body.barcode),
            Barcode_Type: emptyToNull(req.body.barcodeType),
            Auto_Generate_Barcode: toBoolean(req.body.autoGenerateBarcode),
            Is_Ishara_Product: isIsharaProduct,
            S_ID: emptyToNull(req.body.supplierId) ? parseInt(req.body.supplierId) : null,
            // Status is NOT updated as it's calculated dynamically based on stock levels
        };

        console.log("📝 Update Data prepared:", updateData);
        
        // Validate required fields
        if (!updateData.P_Code) {
            return res.status(400).json({ success: false, error: "Product code is required" });
        }
        if (!updateData.P_Name) {
            return res.status(400).json({ success: false, error: "Product name is required" });
        }
        if (!updateData.P_Type) {
            return res.status(400).json({ success: false, error: "Product type is required" });
        }
        if (!updateData.Base_Unit) {
            return res.status(400).json({ success: false, error: "Base unit is required" });
        }
        if (updateData.Retail_Price <= 0) {
            return res.status(400).json({ success: false, error: "Retail price must be greater than 0" });
        }
        if (updateData.Wholesale_Price <= 0) {
            return res.status(400).json({ success: false, error: "Wholesale price must be greater than 0" });
        }
        
        console.log("✓ Validation passed, updating product...");

        //transaction - If one update fails, all changes rollback.
        await sequelize.transaction(async (transaction) => {
            //Find product by ID.
            const product = await Product.findByPk(id, { transaction });
            if (!product) {
                const notFound = new Error("Product not found");
                notFound.status = 404;
                throw notFound;
            }

            //Update product table with new data.
            await product.update(updateData, { transaction });
            console.log("Product updated successfully.");
            
            // Sync units in place so existing U_ID values used by sales/purchases are preserved.
            //Updates unit conversions.
            if (req.body.units !== undefined) {
                console.log("Handling unit conversions...");
                await syncProductUnits(id, req.body.baseUnit, units, transaction);
                console.log("Unit conversions synced:", units.length);
            }

            // Update inventory for supplier items and Ishara products if initialQty provided
            console.log("initialQty value:", req.body.initialQty);

            if (req.body.initialQty !== undefined && req.body.initialQty !== null && req.body.initialQty !== '') {
                console.log("Handling inventory update...");
                const initialQty = parseFloat(req.body.initialQty);  //Convert quantity to number
                console.log("Parsed initialQty:", initialQty);
                
                let inventoryLocation = null;
                // Determine inventory location based on product type
                if (req.body.type === 'Other') {
                    inventoryLocation = 'Shop';
                } else if (req.body.type === 'Raw') {
                    inventoryLocation = 'Production';
                } else if (req.body.type === 'Company' && isIsharaProduct) {
                    inventoryLocation = 'Shop';
                }
                
                console.log("Inventory location:", inventoryLocation, "Initial Qty:", initialQty);
                
                if (inventoryLocation && !isNaN(initialQty) && initialQty >= 0) {
                    //Checks whether inventory already exists. If exists, update quantity. If not exists, create new inventory record.
                    const existingInventory = await Inventory.findOne({
                        where: { P_ID: id, Location: inventoryLocation },
                        transaction
                    });

                    if (existingInventory) {
                        await existingInventory.update(
                            { Qty: initialQty },
                            { transaction }
                        );
                        console.log(`Updated inventory for product ${id} to quantity ${initialQty} at location ${inventoryLocation}`);
                    } else if (initialQty > 0) {
                        await Inventory.create({
                            P_ID: id,
                            Location: inventoryLocation,
                            Qty: initialQty
                        }, { transaction });
                        console.log(`Created inventory entry for product ${id} with quantity ${initialQty} at location ${inventoryLocation}`);
                    }
                }
            }
        });
        
        res.json({ success: true, message: "Product updated successfully!" });
    } catch (err) {
        console.error("❌ Error updating product:", err);
        res.status(err.status || 500).json({ success: false, error: err.message, message: err.message, details: err.stack });
    }
};

// 5. Delete Product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.destroy({ where: { P_ID: id } });
        res.json({ success: true, message: "Product deleted!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 6. Get Product Inventory by Location
const getProductLocationInventory = async (req, res) => {
    try {
        const { productId } = req.params;
        const inventories = await Inventory.findAll({
            attributes: ['Location', 'Qty'],
            where: { P_ID: productId }
        });
        
        const result = {
            'Main_Warehouse': 0,
            'Production': 0,
            'Shop': 0
        };
        
        //Loop each inventory row and add quantity by location.
        inventories.forEach(inv => {
            if (inv.Location && result.hasOwnProperty(inv.Location)) {
                result[inv.Location] += parseFloat(inv.Qty) || 0;
            }
        });
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 7. Get Product Unit Conversions (for card/packet calculations)
const getProductUnitConversions = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const units = await UnitConversion.findAll({
            where: { P_ID: productId },
            attributes: ['U_ID', 'Unit_Name', 'Unit_Conversion', 'Is_Base_Unit', 'Display_Order'],
            order: [['Display_Order', 'ASC']]
        });

        //If no units exist send empty unit list
        if (units.length === 0) {
            return res.json({
                success: true,
                units: [],
                baseUnit: 'Unit',
                message: 'No unit conversions found for this product'
            });
        }

        // Find base unit
        const baseUnit = units.find(u => u.Is_Base_Unit) || units[0];

        res.json({
            success: true,
            units: units.map(u => ({
                U_ID: u.U_ID,
                name: u.Unit_Name,
                conversion: parseFloat(u.Unit_Conversion),
                isBase: u.Is_Base_Unit
            })),
            baseUnit: {
                name: baseUnit.Unit_Name,
                conversion: parseFloat(baseUnit.Unit_Conversion)
            }
        });
    } catch (err) {
        console.error("Get Unit Conversions Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 8. Get Available Base Units
const getAvailableBaseUnits = async (req, res) => {
    try {
        const units = await UnitConversion.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('Unit_Name')), 'Unit_Name']],
            where: { Is_Base_Unit: true },
            raw: true
        });
        
        res.json({
            success: true,
            units: units.map(u => u.Unit_Name).sort()
        });
    } catch (err) {
        console.error("Get Available Base Units Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 9. Get Available Alternative Units
const getAvailableAlternativeUnits = async (req, res) => {
    try {
        const units = await UnitConversion.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('Unit_Name')), 'Unit_Name']],
            where: { Is_Base_Unit: false },
            raw: true
        });
        
        res.json({
            success: true,
            units: units.map(u => u.Unit_Name).sort()
        });
    } catch (err) {
        console.error("Get Available Alternative Units Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { 
    getDashboardStats, 
    getAllStockLevels,
    getProducts, 
    addProduct, 
    deleteProduct, 
    updateProduct, 
    getProductLocationInventory,
    getProductUnitConversions,
    getAvailableBaseUnits,
    getAvailableAlternativeUnits
};
