const express = require('express');
const router = express.Router();
const {searchProducts,allUnits,getBaseUnitQty,generateInvoiceNo, postSalesData,getProductQuntity,getAllSales, updateBillPrintStatus} = require('../../controllers/sales/SalesController')
const { verifyAccessToken } = require('../../middleware/authMiddleware');

 router.get('/search',searchProducts);
 router.get('/units', allUnits);
 router.get('/base-unit', getBaseUnitQty);
 router.get('/generate-invoice-no', generateInvoiceNo);
 router.post('/', verifyAccessToken, postSalesData);
 router.get('/product-quantity/:productId', getProductQuntity);
 router.get('/all', getAllSales);
 router.put('/update-print-status/:invoiceNo', updateBillPrintStatus);

 module.exports = router;