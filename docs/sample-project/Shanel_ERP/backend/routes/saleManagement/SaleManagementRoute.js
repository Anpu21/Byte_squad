const express = require('express');
const router = express.Router();
const {
    // Section 1: Dashboard Metrics
    getTodayMetrics,
    getSalesMetricsByPeriod,
    getSalesPerformanceMetrics,

    // Section 2: Sales History & Retrieval
    getSalesHistory,
    getSaleDetails,
    getSaleItemsBySaleId,

    // Section 3: Search & Filtering
    searchSales,
    filterSalesByDateRange,
    getSalesByPaymentStatus,
    getSalesByLocation,
    getDueSales,

    // Section 4: Analytics
    getTopSellingProducts,
    getPaymentMethodBreakdown,
    getCustomerSalesSummary,
    getSalesBySaleType,

    // Section 5: Detailed Reports
    getMonthlySalesReport,
    getCompanyItemSalesReport,
    getOtherItemSalesReport,
    getLocationWiseSalesReport,
    getLocationSalesBreakdown,

    // Section 6: Write Operations
    createSale,
    addPaymentToSale,
    voidSale,
    printSale
} = require('../../controllers/salesManagement/SalesManagementController_FIXED');

// ============================================================================
// DASHBOARD & METRICS ROUTES
// ============================================================================

/**
 * GET /api/sales-management/metrics/today
 * Get today's metrics (sales, revenue, discount, tax, transactions)
 */
router.get('/metrics/today', getTodayMetrics);

/**
 * GET /api/sales-management/metrics/period
 * Get sales metrics for a period (week/month/year)
 * Query params: period (week|month|year)
 */
router.get('/metrics/period', getSalesMetricsByPeriod);

/**
 * GET /api/sales-management/metrics/performance
 * Get sales performance metrics (conversion rate, avg ticket, etc.)
 */
router.get('/metrics/performance', getSalesPerformanceMetrics);

// ============================================================================
// SALES HISTORY & RETRIEVAL ROUTES
// ============================================================================

/**
 * GET /api/sales-management/history
 * Get sales history with pagination
 * Query params: page, limit
 */
router.get('/history', getSalesHistory);

// ============================================================================
// SEARCH & FILTERING ROUTES (MUST BE BEFORE /:saleId CATCH-ALL)
// ============================================================================

/**
 * GET /api/sales-management/search
 * Search sales by multiple criteria
 * Query params: query, startDate, endDate, paymentStatus, location
 */
router.get('/search', searchSales);

/**
 * GET /api/sales-management/filter/date-range
 * Filter sales by date range
 * Query params: startDate, endDate, page, limit
 */
router.get('/filter/date-range', filterSalesByDateRange);

/**
 * GET /api/sales-management/filter/payment-status
 * Filter sales by payment status
 * Query params: paymentStatus (Paid|Unpaid|Partially_Paid), page, limit
 */
router.get('/filter/payment-status', getSalesByPaymentStatus);

/**
 * GET /api/sales-management/filter/location
 * Filter sales by location
 * Query params: location (Shop|Production|Main_Warehouse), page, limit
 */
router.get('/filter/location', getSalesByLocation);

/**
 * GET /api/sales-management/filter/due-sales
 * Get due/pending payments
 * Query params: page, limit
 */
router.get('/filter/due-sales', getDueSales);

// ============================================================================
// ANALYTICS ROUTES (MUST BE BEFORE /:saleId CATCH-ALL)
// ============================================================================

/**
 * GET /api/sales-management/analytics/top-products
 * Get top selling products
 * Query params: limit, period (week|month|year)
 */
router.get('/analytics/top-products', getTopSellingProducts);

/**
 * GET /api/sales-management/analytics/location-sales
 * Get sales breakdown by location
 */
router.get('/analytics/location-sales', getLocationSalesBreakdown);

/**
 * GET /api/sales-management/analytics/customer-summary
 * Get customer-wise sales summary
 * Query params: limit, page
 */
router.get('/analytics/customer-summary', getCustomerSalesSummary);

/**
 * GET /api/sales-management/analytics/payment-method
 * Get payment method breakdown
 * Query params: startDate, endDate
 */
router.get('/analytics/payment-method', getPaymentMethodBreakdown);

/**
 * GET /api/sales-management/analytics/by-type
 * Get sales by type (Retail/Wholesale)
 */
router.get('/analytics/by-type', getSalesBySaleType);

// ============================================================================
// REPORTS ROUTES (MUST BE BEFORE /:saleId CATCH-ALL)
// ============================================================================

/**
 * GET /api/sales-management/reports/monthly
 * Get monthly sales report
 * Query params: month (1-12), year
 */
router.get('/reports/monthly', getMonthlySalesReport);

/**
 * GET /api/sales-management/reports/company-sales
 * Get company items sales report
 * Query params: month (1-12), year
 */
router.get('/reports/company-sales', getCompanyItemSalesReport);

/**
 * GET /api/sales-management/reports/other-sales
 * Get other items sales report
 * Query params: month (1-12), year
 */
router.get('/reports/other-sales', getOtherItemSalesReport);

/**
 * GET /api/sales-management/reports/location-wise
 * Get sales report by location
 * Query params: location (Shop|Production|Main_Warehouse), month, year
 */
router.get('/reports/location-wise', getLocationWiseSalesReport);

// ============================================================================
// SPECIFIC SALE ROUTES (BEFORE CATCH-ALL :saleId)
// ============================================================================

/**
 * GET /api/sales-management/:saleId/items
 * Get sale items by sale ID
 */
router.get('/:saleId/items', getSaleItemsBySaleId);

// ============================================================================
// CATCH-ALL SALE DETAILS ROUTE (:saleId - MUST BE LAST)
// ============================================================================

/**
 * GET /api/sales-management/:saleId
 * Get sale details by ID
 * IMPORTANT: This must be AFTER all other specific routes!
 */
router.get('/:saleId', getSaleDetails);

// ============================================================================
// WRITE OPERATIONS ROUTES (POST)
// ============================================================================

/**
 * POST /api/sales-management/sales/create
 * Create new sale with line items and inventory deduction
 * Body: { C_ID, Location, Sale_Type, items[], Discount_Amount, Tax_Amount }
 */
router.post('/sales/create', createSale);

/**
 * POST /api/sales-management/sales/:id/payment
 * Add payment to existing sale
 * Body: { Payment_Method, Payment_Amount, Cash_Amount, Cash_Tendered, Cash_Change }
 */
router.post('/sales/:id/payment', addPaymentToSale);

/**
 * POST /api/sales-management/sales/:id/void
 * Void/cancel a sale (reverse all transactions)
 * Body: None
 */
router.post('/sales/:id/void', voidSale);

/**
 * POST /api/sales-management/sales/:id/print
 * Mark invoice as printed and log print details
 * Body: None
 */
router.post('/sales/:id/print', printSale);

module.exports = router;
