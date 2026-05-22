const Product = require('./Product');
const Production = require('./Production');
const Inventory = require('./Inventory');
const StockTransfer = require('./StockTransfer');
const StockAdjustment = require('./StockAdjustment');
const UnitConversion = require('./UnitConversion');
const ProductReturn = require('./ProductReturn');
const Supplier = require('./Supplier');
const User = require('../user/User');

module.exports = () => {
    // ===== PRODUCT ASSOCIATIONS =====
    
    // Product <-> Supplier (One Product belongs to One Supplier)
    Product.belongsTo(Supplier, { foreignKey: 'S_ID', as: 'supplier' });
    Supplier.hasMany(Product, { foreignKey: 'S_ID', as: 'products' });
    
    // Product <-> Inventory (One Product has Many Inventory Records)
    Product.hasMany(Inventory, { foreignKey: 'P_ID', as: 'inventories' });
    Inventory.belongsTo(Product, { foreignKey: 'P_ID' });

    // Product <-> Production (One Product has Many Production Batches)
    Product.hasMany(Production, { foreignKey: 'P_ID', as: 'batches' });
    Production.belongsTo(Product, { foreignKey: 'P_ID' });

    // Product <-> UnitConversion (One Product has Many Units)
    Product.hasMany(UnitConversion, { foreignKey: 'P_ID', as: 'units' });
    UnitConversion.belongsTo(Product, { foreignKey: 'P_ID' });

    // Product <-> ProductReturn
    Product.hasMany(ProductReturn, { foreignKey: 'P_ID', as: 'returns' });
    ProductReturn.belongsTo(Product, { foreignKey: 'P_ID' });

    // Product <-> StockAdjustment
    Product.hasMany(StockAdjustment, { foreignKey: 'P_ID', as: 'adjustments' });
    StockAdjustment.belongsTo(Product, { foreignKey: 'P_ID' });

    // Product <-> StockTransfer
    Product.hasMany(StockTransfer, { foreignKey: 'P_ID', as: 'stockTransfers' });
    StockTransfer.belongsTo(Product, { foreignKey: 'P_ID', as: 'product' });

    // Product <-> User (Created By) - For audit trail
    User.hasMany(Product, { foreignKey: 'Created_By', as: 'CreatedProducts' });
    Product.belongsTo(User, { foreignKey: 'Created_By', as: 'creator' });

    // ===== PRODUCTION ASSOCIATIONS =====
    
    // Production <-> Inventory (One Batch has Many Inventory Records)
    Production.hasMany(Inventory, { foreignKey: 'PR_ID', as: 'batchInventories' });
    Inventory.belongsTo(Production, { foreignKey: 'PR_ID' });

    // Production <-> StockTransfer
    Production.hasMany(StockTransfer, { foreignKey: 'PR_ID', as: 'transfers' });
    StockTransfer.belongsTo(Production, { foreignKey: 'PR_ID' });

    // Production <-> StockAdjustment
    Production.hasMany(StockAdjustment, { foreignKey: 'PR_ID', as: 'batchAdjustments' });
    StockAdjustment.belongsTo(Production, { foreignKey: 'PR_ID' });

    // Production <-> ProductReturn
    Production.hasMany(ProductReturn, { foreignKey: 'PR_ID', as: 'batchReturns' });
    ProductReturn.belongsTo(Production, { foreignKey: 'PR_ID' });

    // Production <-> User (Quality Checked By)
    User.hasMany(Production, { foreignKey: 'Quality_Checked_By', as: 'QualityCheckedProduction' });
    Production.belongsTo(User, { foreignKey: 'Quality_Checked_By', as: 'QualityChecker' });

    // Production <-> User (Created By)
    User.hasMany(Production, { foreignKey: 'Created_By', as: 'CreatedProduction' });
    Production.belongsTo(User, { foreignKey: 'Created_By', as: 'ProductionCreator' });

    // ===== STOCK MOVEMENT ASSOCIATIONS =====
    
    // StockTransfer <-> User (Transferred By)
    User.hasMany(StockTransfer, { foreignKey: 'Transferred_By', as: 'TransferredStock' });
    StockTransfer.belongsTo(User, { foreignKey: 'Transferred_By', as: 'TransferredByUser' });

    // StockTransfer <-> User (Received By)
    User.hasMany(StockTransfer, { foreignKey: 'Received_By', as: 'ReceivedStock' });
    StockTransfer.belongsTo(User, { foreignKey: 'Received_By', as: 'ReceivedByUser' });

    // StockTransfer <-> User (Created By)
    User.hasMany(StockTransfer, { foreignKey: 'Created_By', as: 'CreatedTransfer' });
    StockTransfer.belongsTo(User, { foreignKey: 'Created_By', as: 'TransferCreator' });

    // StockAdjustment <-> User (Approved By)
    User.hasMany(StockAdjustment, { foreignKey: 'Approved_By', as: 'ApprovedAdjustments' });
    StockAdjustment.belongsTo(User, { foreignKey: 'Approved_By', as: 'ApprovedByUser' });

    // StockAdjustment <-> User (Created By)
    User.hasMany(StockAdjustment, { foreignKey: 'Created_By', as: 'CreatedAdjustment' });
    StockAdjustment.belongsTo(User, { foreignKey: 'Created_By', as: 'AdjustmentCreator' });

    // ===== PRODUCT RETURN ASSOCIATIONS =====
    
    // ProductReturn <-> User (Approved By)
    User.hasMany(ProductReturn, { foreignKey: 'Approved_By', as: 'ApprovedReturns' });
    ProductReturn.belongsTo(User, { foreignKey: 'Approved_By', as: 'ApprovedByUser' });

    // ProductReturn <-> User (Created By)
    User.hasMany(ProductReturn, { foreignKey: 'Created_By', as: 'CreatedReturn' });
    ProductReturn.belongsTo(User, { foreignKey: 'Created_By', as: 'ReturnCreator' });
};
