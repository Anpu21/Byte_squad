const express = require("express");
const router = express.Router();
const upload = require("../../middleware/uploadMiddleware");
const { getDashboardStats, getAllStockLevels, getProducts, addProduct, deleteProduct, updateProduct, getProductLocationInventory, getProductUnitConversions, getAvailableBaseUnits, getAvailableAlternativeUnits } = require("../../controllers/inventory/inventoryController");
const { createAdjustment, getAdjustments, updateAdjustment, deleteAdjustment } = require("../../controllers/inventory/adjustmentController");
const { processReturn, getReturnLogs, updateReturn, deleteReturn, searchInvoice, getInvoiceDetails } = require("../../controllers/inventory/returnController");

const { getSuppliers, createSupplier } = require("../../controllers/inventory/supplierController");

// Existing Routes...
router.get("/dashboard-stats", getDashboardStats);
router.get("/stock-levels", getAllStockLevels);
router.get("/products", getProducts);
router.get("/product/:productId/locations", getProductLocationInventory);
router.get("/product/:productId/units", getProductUnitConversions);
router.get("/available-base-units", getAvailableBaseUnits);
router.get("/available-alternative-units", getAvailableAlternativeUnits);
router.post("/products", upload.single('image'), addProduct);
router.delete("/products/:id", deleteProduct);
router.put("/products/:id", upload.single('image'), updateProduct);

// Supplier Routes
router.get("/suppliers", getSuppliers);
router.post("/suppliers", createSupplier);

// Stock Adjustment Routes
router.get("/adjustments", getAdjustments);
router.post("/adjustments/adjust", createAdjustment);
router.put("/adjustments/:id", updateAdjustment);
router.delete("/adjustments/:id", deleteAdjustment);

// Product Return Routes
router.get("/returns", getReturnLogs);
router.post("/returns/process", processReturn);
router.put("/returns/:RT_ID", updateReturn);
router.delete("/returns/:RT_ID", deleteReturn);
router.get("/invoice/:invoiceNo", searchInvoice);
router.get("/invoice-details/:saleId", getInvoiceDetails);

module.exports = router;
