const sequelize = require("../../config/db");
const { Op, Sequelize } = require("sequelize");

// Import all required models
const {
    Sale,
    SaleItem,
    Payment,
    Customer,
    Product,
    UnitConversion,
    CreditTranscation,
    Inventory,
    StockMovement
} = require('../../models/index');

/**
 * ============================================================================
 * SECTION 1: DASHBOARD METRICS
 * ============================================================================
 * 
 * These functions provide real-time dashboard data for business overview
 * They use database aggregations (SUM, COUNT, AVG) for performance
 */

/**
 * getTodayMetrics()
 * 
 * PURPOSE: Get all today's sales metrics in a single call for dashboard
 * 
 * ENDPOINT: GET /api/sales-management/metrics/today
 * 
 * PARAMETERS: None (uses current date)
 * 
 * RETURNS: {
 *   totalSales: number (sum of all invoice totals today),
 *   totalRevenue: number (actual cash received today),
 *   totalDiscount: number (sum of discounts given),
 *   totalTax: number (sum of tax collected),
 *   totalTransactions: number (count of invoices)
 * }
 * 
 * EXAMPLE RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "totalSales": 500000,
 *     "totalRevenue": 480000,
 *     "totalDiscount": 15000,
 *     "totalTax": 45000,
 *     "totalTransactions": 52
 *   }
 * }
 */
const getTodayMetrics = async (req, res) => {
    try {
        // Set date range: today 00:00:00 to tomorrow 00:00:00
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Query database for today's aggregated metrics
        const metrics = await Sale.findAll({
            where: {
                Sale_Date: {
                    [Op.between]: [today, tomorrow]  // Today's sales only
                },
                Status: 'Active'  // Exclude voided/cancelled sales
            },
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'totalSales'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'totalRevenue'],
                [Sequelize.fn('SUM', Sequelize.col('Discount_Amount')), 'totalDiscount'],
                [Sequelize.fn('SUM', Sequelize.col('Tax_Amount')), 'totalTax'],
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'salesCount']
            ],
            raw: true  // Return plain objects, not Sequelize model instances
        });

        // Handle case when no sales today (metrics[0] would be undefined)
        const data = metrics[0] || {};

        console.log("✓ Today's Metrics:", data);

        return res.status(200).json({
            success: true,
            data: {
                totalSales: parseFloat(data.totalSales) || 0,
                totalRevenue: parseFloat(data.totalRevenue) || 0,
                totalDiscount: parseFloat(data.totalDiscount) || 0,
                totalTax: parseFloat(data.totalTax) || 0,
                totalTransactions: parseInt(data.salesCount) || 0
            },
            message: "Today's metrics fetched successfully"
        });

    } catch (error) {
        console.error("❌ Error fetching today's metrics:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s metrics',
            error: error.message
        });
    }
};

/**
 * getSalesMetricsByPeriod()
 * 
 * PURPOSE: Get aggregated sales metrics for a specified period
 * Used for trend analysis and period-over-period comparison
 * 
 * ENDPOINT: GET /api/sales-management/metrics/period?period=month
 * 
 * PARAMETERS:
 *   - period: 'week' | 'month' | 'year' (default: 'month')
 * 
 * RETURNS: {
 *   totalSales, totalRevenue, totalDiscount, totalTax,
 *   totalTransactions, avgSaleValue
 * }
 */
const getSalesMetricsByPeriod = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const today = new Date();
        let startDate;

        // Determine date range based on period parameter
        switch (period) {
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);  // Last 7 days
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 1);  // Last 30 days
                break;
            case 'year':
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);  // Last 365 days
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid period. Valid options: week, month, year'
                });
        }

        // Aggregate metrics for the period
        const metrics = await Sale.findAll({
            where: {
                Sale_Date: { [Op.gte]: startDate },
                Status: 'Active'
            },
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'totalSales'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'totalRevenue'],
                [Sequelize.fn('SUM', Sequelize.col('Discount_Amount')), 'totalDiscount'],
                [Sequelize.fn('SUM', Sequelize.col('Tax_Amount')), 'totalTax'],
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'totalTransactions'],
                [Sequelize.fn('AVG', Sequelize.col('Total_Amount')), 'avgSaleValue']
            ],
            raw: true
        });

        const data = metrics[0] || {};

        console.log(`✓ ${period.charAt(0).toUpperCase() + period.slice(1)} Metrics:`, data);

        return res.status(200).json({
            success: true,
            period,
            data: {
                totalSales: parseFloat(data.totalSales) || 0,
                totalRevenue: parseFloat(data.totalRevenue) || 0,
                totalDiscount: parseFloat(data.totalDiscount) || 0,
                totalTax: parseFloat(data.totalTax) || 0,
                totalTransactions: parseInt(data.totalTransactions) || 0,
                avgSaleValue: parseFloat(data.avgSaleValue) || 0
            },
            message: `${period} metrics fetched successfully`
        });

    } catch (error) {
        console.error('❌ Error fetching period metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching metrics',
            error: error.message
        });
    }
};

/**
 * getSalesPerformanceMetrics()
 * 
 * PURPOSE: Calculate business KPIs for management dashboard
 * Measures: conversion rate, ticket size, customer engagement
 * 
 * ENDPOINT: GET /api/sales-management/metrics/performance
 * 
 * RETURNS: {
 *   totalCustomers: total customers in system,
 *   todayActiveCustomers: customers who bought today,
 *   conversionRate: (active / total) × 100,
 *   averageBillValue: average invoice amount,
 *   todayTransactionCount: number of sales today
 * }
 * 
 * LOGIC:
 * Conversion Rate = (Customers who bought today / Total customers) × 100
 * This shows what % of your customer base is active on any given day
 */
const getSalesPerformanceMetrics = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count total customers in system
        const totalCustomers = await Customer.count();

        // Count unique customers who made purchases today
        const todaysCustomers = await Sale.count({
            distinct: true,
            col: 'C_ID',
            where: {
                Sale_Date: today,
                Status: 'Active'
            }
        });

        // Get today's sales metrics
        const todayMetrics = await Sale.findAll({
            where: {
                Sale_Date: today,
                Status: 'Active'
            },
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'salesCount'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'totalSales'],
                [Sequelize.fn('AVG', Sequelize.col('Total_Amount')), 'averageBillValue']
            ],
            raw: true
        });

        const data = todayMetrics[0] || {};

        // Calculate conversion rate
        // FORMULA: (customers who bought today / total customers) × 100
        const conversionRate = totalCustomers > 0
            ? ((todaysCustomers / totalCustomers) * 100).toFixed(2)
            : 0;

        console.log("✓ Sales Performance Metrics:", {
            totalCustomers,
            todaysCustomers,
            conversionRate: `${conversionRate}%`
        });

        return res.status(200).json({
            success: true,
            data: {
                totalCustomers,
                todayActiveCustomers: todaysCustomers,
                conversionRate: `${conversionRate}%`,  // Format as percentage
                averageBillValue: parseFloat(data.averageBillValue) || 0,
                todayTransactionCount: parseInt(data.salesCount) || 0
            },
            message: 'Sales performance metrics fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching sales performance metrics:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sales performance metrics',
            error: error.message
        });
    }
};

/**
 * ============================================================================
 * SECTION 2: SALES HISTORY & RETRIEVAL
 * ============================================================================
 * 
 * These functions retrieve detailed sales records with associated data
 * All support pagination for large datasets
 */

/**
 * getSalesHistory()
 * 
 * PURPOSE: Get paginated list of all sales with customer and payment details
 * Used for: Sales reports, transaction history view
 * 
 * ENDPOINT: GET /api/sales-management/history?page=1&limit=20
 * 
 * PARAMETERS:
 *   - page: page number (default: 1)
 *   - limit: records per page (default: 20, max recommended: 50)
 * 
 * RETURNS: Array of sales with:
 *   - Basic info: Invoice_No, Sale_Date, Total_Amount, Payment_Status
 *   - Customer details: C_Name, Phone, Email
 *   - Line items: Product quantities and prices
 *   - Payments: Payment methods and amounts
 * 
 * PAGINATION: {
 *   total: 150 (total records),
 *   page: 1,
 *   pages: 8 (total pages),
 *   limit: 20
 * }
 */
const getSalesHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Sale.findAndCountAll({
            where: { Status: 'Active' },  // Only active sales
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1', 'Email', 'Customer_Type']
                },
                {
                    model: SaleItem,
                    as: 'SaleItems',
                    attributes: ['Sale_Item_Id', 'P_ID', 'Quantity', 'Unit_Price', 'Line_Total']
                },
                {
                    model: Payment,
                    as: 'Payments',
                    attributes: ['Pay_ID', 'Payment_Method', 'Payment_Amount', 'Payment_Date']
                }
            ],
            attributes: [
                'Sale_Id', 'Invoice_No', 'Sale_Date', 'Sale_Time', 'Location',
                'Sale_Type', 'Price_Level', 'Subtotal', 'Discount_Amount',
                'Tax_Amount', 'Total_Amount', 'Payment_Status',
                'Paid_Amount', 'Balance_Due', 'Bill_Printed', 'Notes', 'Status'
            ],
            order: [['Sale_Date', 'DESC'], ['Sale_Time', 'DESC']],  // Latest first
            limit: parseInt(limit),
            offset: offset,
            raw: false  // Keep Sequelize model instances for nested data
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit)),
                limit: parseInt(limit)
            },
            message: "Sales history fetched successfully"
        });

    } catch (error) {
        console.error("❌ Error fetching sales history:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sales history',
            error: error.message
        });
    }
};

/**
 * getSaleDetails()
 * 
 * PURPOSE: Get complete details of a single sale
 * Used for: Invoice view, sale editing, detailed audit trail
 * 
 * ENDPOINT: GET /api/sales-management/:saleId
 * 
 * PARAMETERS:
 *   - saleId: sales ID (from URL)
 * 
 * RETURNS: Complete sale object with:
 *   - All sale fields (date, amount, status, etc.)
 *   - Full customer details (address, credit limit, balance)
 *   - All line items with product names and units
 *   - All payments with methods and dates
 * 
 * ERROR CASES:
 *   - Invalid saleId: 400 Bad Request
 *   - Sale not found: 404 Not Found
 */
const getSaleDetails = async (req, res) => {
    try {
        const { saleId } = req.params;

        // Validate sale ID
        if (!saleId || isNaN(saleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale ID'
            });
        }

        // Fetch sale with all nested associations
        const sale = await Sale.findByPk(saleId, {
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: [
                        'C_ID', 'C_Name', 'Phone1', 'Phone2', 'Email',
                        'Address', 'Customer_Type', 'Credit_Limit', 'Current_Balance'
                    ]
                },
                {
                    model: SaleItem,
                    as: 'SaleItems',
                    include: [
                        {
                            model: Product,
                            as: 'Product',
                            attributes: ['P_ID', 'P_Name', 'P_Code', 'Base_Unit', 'Retail_Price', 'Wholesale_Price']
                        },
                        {
                            model: UnitConversion,
                            as: 'UnitConversion',
                            attributes: ['U_ID', 'Unit_Name', 'Unit_Conversion']
                        }
                    ]
                },
                {
                    model: Payment,
                    as: 'Payments',
                    attributes: ['Pay_ID', 'Payment_Method', 'Payment_Amount', 'Payment_Date', 'Payment_Time', 'Status']
                }
            ]
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        console.log(`✓ Sale #${saleId} details retrieved`);

        return res.status(200).json({
            success: true,
            data: sale,
            message: 'Sale details fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching sale details:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sale details',
            error: error.message
        });
    }
};

/**
 * getSaleItemsBySaleId()
 * 
 * PURPOSE: Get all line items for a specific sale
 * Used for: Invoice details, item-level editing, return processing
 * 
 * ENDPOINT: GET /api/sales-management/:saleId/items
 * 
 * RETURNS: Array of sale items with:
 *   - Item details: quantity, unit price, line total
 *   - Product info: name, code, base unit, prices
 *   - Unit info: unit name, conversion factor
 * 
 * Each item includes: {
 *   Sale_Item_Id, Quantity, Unit_Price, Line_Total,
 *   Product: { P_Name, P_Code, Retail_Price, Wholesale_Price },
 *   Unit: { Unit_Name, Unit_Conversion }
 * }
 */
const getSaleItemsBySaleId = async (req, res) => {
    try {
        const { saleId } = req.params;

        // Validate sale ID
        if (!saleId || isNaN(saleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale ID'
            });
        }

        // Fetch all items for this sale with product details
        const saleItems = await SaleItem.findAll({
            where: { Sale_ID: saleId },
            include: [
                {
                    model: Product,
                    as: 'Product',
                    attributes: ['P_ID', 'P_Name', 'P_Code', 'Base_Unit', 'Retail_Price', 'Wholesale_Price']
                },
                {
                    model: UnitConversion,
                    as: 'UnitConversion',
                    attributes: ['U_ID', 'Unit_Name', 'Unit_Conversion']
                }
            ]
        });

        if (!saleItems || saleItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No items found for this sale'
            });
        }

        console.log(`✓ Retrieved ${saleItems.length} items for sale #${saleId}`);

        return res.status(200).json({
            success: true,
            data: saleItems,
            count: saleItems.length,
            message: 'Sale items fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching sale items:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sale items',
            error: error.message
        });
    }
};

/**
 * ============================================================================
 * SECTION 3: ADVANCED SEARCH & FILTERING
 * ============================================================================
 * 
 * These functions filter sales based on various criteria
 * Support pagination and multiple filter combinations
 */

/**
 * searchSales()
 * 
 * PURPOSE: Multi-criteria search for sales
 * Allows searching by invoice number, date range, payment status, location
 * 
 * ENDPOINT: GET /api/sales-management/search
 * 
 * QUERY PARAMETERS (all optional, can be combined):
 *   - query: search by invoice number (e.g., "INV-2026-000123")
 *   - startDate: YYYY-MM-DD format
 *   - endDate: YYYY-MM-DD format
 *   - paymentStatus: 'Paid' | 'Unpaid' | 'Partially_Paid'
 *   - location: 'Shop' | 'Production' | 'Main_Warehouse'
 *   - page: page number (default: 1)
 *   - limit: records per page (default: 20)
 * 
 * EXAMPLE:
 * GET /search?query=INV-2026&paymentStatus=Unpaid&startDate=2026-05-01&location=Shop
 * 
 * This finds all unpaid sales from May 2026 at Shop location with invoice containing "INV-2026"
 */
const searchSales = async (req, res) => {
    try {
        const {
            query,
            startDate,
            endDate,
            paymentStatus,
            location,
            page = 1,
            limit = 20
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = { Status: 'Active' };  // Only search active sales

        // Add invoice number search
        if (query && query.trim()) {
            where[Op.or] = [
                { Invoice_No: { [Op.like]: `%${query}%` } }
            ];
        }

        // Add location filter
        if (location && ['Shop', 'Production', 'Main_Warehouse'].includes(location)) {
            where.Location = location;
        }

        // Add payment status filter
        if (paymentStatus && ['Paid', 'Unpaid', 'Partially_Paid'].includes(paymentStatus)) {
            where.Payment_Status = paymentStatus;
        }

        // Add date range filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);  // Include entire end date
            where.Sale_Date = { [Op.between]: [start, end] };
        } else if (startDate) {
            where.Sale_Date = { [Op.gte]: new Date(startDate) };
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.Sale_Date = { [Op.lte]: end };
        }

        // Execute search query
        const { count, rows } = await Sale.findAndCountAll({
            where,
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1', 'Email', 'Customer_Type']
                },
                {
                    model: SaleItem,
                    as: 'SaleItems',
                    attributes: ['Sale_Item_Id', 'P_ID', 'Quantity', 'Unit_Price', 'Line_Total']
                },
                {
                    model: Payment,
                    as: 'Payments',
                    attributes: ['Pay_ID', 'Payment_Method', 'Payment_Amount', 'Payment_Date']
                }
            ],
            order: [['Sale_Date', 'DESC'], ['Sale_Time', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            subQuery: false  // Important for correct pagination with includes
        });

        console.log(`✓ Search found ${count} results`);

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit)),
                limit: parseInt(limit)
            },
            message: 'Sales search results fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error searching sales:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search sales',
            error: error.message
        });
    }
};

/**
 * filterSalesByDateRange()
 * 
 * PURPOSE: Get all sales within a specific date range
 * 
 * ENDPOINT: GET /api/sales-management/filter/date-range
 * 
 * REQUIRED PARAMETERS:
 *   - startDate: YYYY-MM-DD
 *   - endDate: YYYY-MM-DD
 *   - page: (optional, default: 1)
 *   - limit: (optional, default: 20)
 * 
 * RETURNS: Paginated list of sales between dates (inclusive)
 */
const filterSalesByDateRange = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 20 } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required (YYYY-MM-DD format)'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);  // Include entire end date

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Sale.findAndCountAll({
            where: {
                Sale_Date: { [Op.between]: [start, end] },
                Status: 'Active'
            },
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1']
                },
                {
                    model: SaleItem,
                    as: 'SaleItems',
                    attributes: ['Sale_Item_Id', 'Quantity', 'Line_Total']
                }
            ],
            order: [['Sale_Date', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        console.log(`✓ Date range filter: ${startDate} to ${endDate} found ${count} sales`);

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit))
            },
            message: 'Date range filter applied successfully'
        });

    } catch (error) {
        console.error('❌ Error filtering by date range:', error);
        return res.status(500).json({
            success: false,
            message: 'Error filtering sales',
            error: error.message
        });
    }
};

/**
 * getSalesByPaymentStatus()
 * 
 * PURPOSE: Filter sales by payment status
 * Useful for: Collections, accounting, unpaid invoice reports
 * 
 * ENDPOINT: GET /api/sales-management/filter/payment-status
 * 
 * PARAMETERS:
 *   - paymentStatus: 'Paid' | 'Unpaid' | 'Partially_Paid' (required)
 *   - page: (optional, default: 1)
 *   - limit: (optional, default: 20)
 * 
 * RETURNS: Array of sales with specified payment status + pagination
 */
const getSalesByPaymentStatus = async (req, res) => {
    try {
        const { paymentStatus, page = 1, limit = 20 } = req.query;

        // Validate payment status
        if (!paymentStatus || !['Paid', 'Unpaid', 'Partially_Paid'].includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status. Valid options: Paid, Unpaid, Partially_Paid'
            });
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Sale.findAndCountAll({
            where: {
                Payment_Status: paymentStatus,
                Status: 'Active'
            },
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1']
                },
                {
                    model: Payment,
                    as: 'Payments',
                    attributes: ['Pay_ID', 'Payment_Method', 'Payment_Amount']
                }
            ],
            order: [['Sale_Date', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        console.log(`✓ Found ${count} ${paymentStatus} sales`);

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit))
            },
            message: `${paymentStatus} sales retrieved successfully`
        });

    } catch (error) {
        console.error('❌ Error fetching sales by payment status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales',
            error: error.message
        });
    }
};

/**
 * getSalesByLocation()
 * 
 * PURPOSE: Get sales from a specific location
 * Useful for: Location-specific reporting, inventory sync
 * 
 * ENDPOINT: GET /api/sales-management/filter/location
 * 
 * PARAMETERS:
 *   - location: 'Shop' | 'Production' | 'Main_Warehouse' (required)
 *   - page: (optional, default: 1)
 *   - limit: (optional, default: 20)
 */
const getSalesByLocation = async (req, res) => {
    try {
        const { location, page = 1, limit = 20 } = req.query;

        // Validate location
        if (!location || !['Shop', 'Production', 'Main_Warehouse'].includes(location)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location. Valid options: Shop, Production, Main_Warehouse'
            });
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Sale.findAndCountAll({
            where: {
                Location: location,
                Status: 'Active'
            },
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name']
                }
            ],
            order: [['Sale_Date', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        console.log(`✓ Found ${count} sales from ${location}`);

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit))
            },
            message: `Sales from ${location} retrieved successfully`
        });

    } catch (error) {
        console.error('❌ Error fetching sales by location:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales',
            error: error.message
        });
    }
};

/**
 * getDueSales()
 * 
 * PURPOSE: Get all unpaid and partially-paid invoices (outstanding receivables)
 * Used for: Collections, aged receivables reports, credit follow-up
 * 
 * ENDPOINT: GET /api/sales-management/filter/due-sales
 * 
 * RETURNS: Sales with Balance_Due > 0, sorted by due date (oldest first)
 * Each record shows:
 *   - Invoice details
 *   - Customer info
 *   - Total invoice amount
 *   - Amount paid so far
 *   - Balance still due
 *   - Days since sale/due date
 */
const getDueSales = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Fetch sales where Payment_Status is Unpaid OR Partially_Paid
        const { count, rows } = await Sale.findAndCountAll({
            where: {
                Payment_Status: {
                    [Op.in]: ['Unpaid', 'Partially_Paid']  // Multiple values
                },
                Status: 'Active'
            },
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1', 'Email', 'Customer_Type']
                }
            ],
            attributes: [
                'Sale_Id', 'Invoice_No', 'Sale_Date', 'Due_Date',
                'Total_Amount', 'Paid_Amount', 'Balance_Due', 'Payment_Status'
            ],
            order: [['Due_Date', 'ASC']],  // Oldest dues first (priority for collections)
            limit: parseInt(limit),
            offset: offset,
            raw: false
        });

        console.log(`✓ Found ${count} due/outstanding sales`);

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit))
            },
            message: 'Due sales fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching due sales:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch due sales',
            error: error.message
        });
    }
};

/**
 * ============================================================================
 * SECTION 4: ANALYTICS & REPORTING
 * ============================================================================
 * 
 * These functions provide business intelligence for management
 * Include trend analysis, product performance, customer behavior
 */

/**
 * getTopSellingProducts()
 * 
 * PURPOSE: Identify best-performing products by revenue or quantity
 * Used for: Inventory planning, marketing decisions, stock management
 * 
 * ENDPOINT: GET /api/sales-management/analytics/top-products
 * 
 * PARAMETERS:
 *   - period: 'week' | 'month' | 'year' (default: 'month')
 *   - limit: number of products to return (default: 10)
 * 
 * RETURNS: Array of top products with:
 *   - Product ID and name
 *   - Total quantity sold
 *   - Total revenue generated
 *   - Number of sales transactions
 * 
 * COMPLEX LOGIC:
 * 1. Uses SALE_ITEM table (not SALES) because we need per-item aggregation
 * 2. Joins to SALE table to filter by date and exclude voided sales
 * 3. Joins to PRODUCT table to get product names
 * 4. Groups by P_ID to aggregate all sales of each product
 * 5. Orders by totalRevenue DESC to show top sellers first
 */
const getTopSellingProducts = async (req, res) => {
    try {
        const { limit = 10, period = 'month' } = req.query;
        const today = new Date();

        // Calculate start date based on period
        let startDate;
        switch (period) {
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 1);
        }

        // Query top products
        const topProducts = await SaleItem.findAll({
            attributes: [
                'P_ID',
                [Sequelize.fn('SUM', Sequelize.col('Quantity')), 'totalQuantity'],
                [Sequelize.fn('SUM', Sequelize.col('Line_Total')), 'totalRevenue'],
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Item_Id')), 'salesCount']
            ],
            where: {
                '$Sale.Sale_Date$': { [Op.gte]: startDate },  // Date filter via associated Sale
                '$Sale.Status$': 'Active'  // Only active sales
            },
            include: [
                {
                    model: Sale,
                    attributes: ['Sale_Date'],
                    required: true  // INNER JOIN to filter by sale date
                },
                {
                    model: Product,
                    as: 'Product',
                    attributes: ['P_ID', 'P_Name', 'P_Code', 'Base_Unit', 'Retail_Price']
                }
            ],
            group: ['P_ID'],  // Aggregate all sales per product
            order: [[Sequelize.literal('totalRevenue'), 'DESC']],  // Highest revenue first
            limit: parseInt(limit),
            subQuery: false,
            raw: true
        });

        // Format response
        const formattedProducts = topProducts.map(p => ({
            P_ID: p.P_ID,
            Product_Name: p['Product.P_Name'],
            Product_Code: p['Product.P_Code'],
            totalQuantity: parseFloat(p.totalQuantity) || 0,
            totalRevenue: parseFloat(p.totalRevenue) || 0,
            salesCount: parseInt(p.salesCount) || 0
        }));

        console.log(`✓ Top ${period} products (${formattedProducts.length} found)`);

        return res.status(200).json({
            success: true,
            period,
            data: formattedProducts,
            count: formattedProducts.length,
            message: 'Top selling products fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching top selling products:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch top selling products',
            error: error.message
        });
    }
};

/**
 * getPaymentMethodBreakdown()
 * 
 * PURPOSE: Analyze payment methods used (cash, cheque, bank, credit)
 * Used for: Cashbook reconciliation, payment trend analysis
 * 
 * ENDPOINT: GET /api/sales-management/analytics/payment-method
 * 
 * PARAMETERS:
 *   - period: 'week' | 'month' | 'year' (default: 'month')
 *   - startDate: YYYY-MM-DD (optional - overrides period)
 *   - endDate: YYYY-MM-DD (optional - overrides period)
 * 
 * RETURNS: Array of payment methods with:
 *   - Payment_Method: Cash, Cheque, Bank_Transfer, Credit, etc.
 *   - count: number of transactions
 *   - total: total amount via this method
 * 
 * BUG FIX #3:
 * Previously ignored the 'period' parameter and always used 'last month'
 * NOW: Properly uses period parameter with switch/case logic
 * If startDate/endDate provided, uses those instead
 */
const getPaymentMethodBreakdown = async (req, res) => {
    try {
        const { period = 'month', startDate: providedStart, endDate: providedEnd } = req.query;
        const today = new Date();
        let startDate, endDate;

        // If start/end dates provided, use them; otherwise use period
        if (providedStart && providedEnd) {
            startDate = new Date(providedStart);
            endDate = new Date(providedEnd);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // FIXED BUG #3: Now properly handles period parameter
            switch (period) {
                case 'week':
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    endDate = today;
                    break;
                case 'month':
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    endDate = today;
                    break;
                case 'year':
                    startDate = new Date(today);
                    startDate.setFullYear(today.getFullYear() - 1);
                    endDate = today;
                    break;
                default:
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    endDate = today;
            }
        }

        // Aggregate payments by method
        const breakdown = await Payment.findAll({
            attributes: [
                'Payment_Method',
                [Sequelize.fn('COUNT', Sequelize.col('Pay_ID')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Payment_Amount')), 'total']
            ],
            where: {
                '$Sale.Sale_Date$': { [Op.between]: [startDate, endDate] },
                '$Sale.Status$': 'Active'
            },
            include: [
                {
                    model: Sale,
                    attributes: ['Sale_Date'],
                    required: true
                }
            ],
            group: ['Payment_Method'],
            order: [[Sequelize.literal('total'), 'DESC']],  // Highest amounts first
            subQuery: false,
            raw: true
        });

        // Format response
        const formattedBreakdown = breakdown.map(item => ({
            Payment_Method: item.Payment_Method,
            count: parseInt(item.count) || 0,
            total: parseFloat(item.total) || 0
        }));

        console.log(`✓ Payment method breakdown (${period}): ${formattedBreakdown.length} methods`);

        return res.status(200).json({
            success: true,
            period,
            data: formattedBreakdown,
            message: 'Payment method breakdown fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching payment method breakdown:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payment method breakdown',
            error: error.message
        });
    }
};

/**
 * getCustomerSalesSummary()
 * 
 * PURPOSE: Get aggregated sales metrics per customer
 * Used for: VIP analysis, customer segmentation, CRM insights
 * 
 * ENDPOINT: GET /api/sales-management/analytics/customer-summary
 * 
 * RETURNS: Array of customers with:
 *   - C_ID, C_Name, Customer_Type
 *   - totalTransactions: number of purchases
 *   - totalSpent: total invoice amount
 *   - totalPaid: cash collected from customer
 *   - totalDue: outstanding balance
 *   - lastSaleDate: most recent purchase
 * 
 * SORTED BY: totalSpent DESC (highest-value customers first)
 */
const getCustomerSalesSummary = async (req, res) => {
    try {
        const { limit = 20, page = 1 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const customerSales = await Sale.findAll({
            attributes: [
                'C_ID',
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'totalTransactions'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'totalSpent'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'totalPaid'],
                [Sequelize.fn('SUM', Sequelize.col('Balance_Due')), 'totalDue'],
                [Sequelize.fn('MAX', Sequelize.col('Sale_Date')), 'lastSaleDate']
            ],
            where: { Status: 'Active' },
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1', 'Customer_Type'],
                    required: true
                }
            ],
            group: ['C_ID'],
            order: [[Sequelize.literal('totalSpent'), 'DESC']],  // Highest spenders first
            limit: parseInt(limit),
            offset: offset,
            subQuery: false,
            raw: true
        });

        // Count total unique customers
        const total = await Sale.count({
            distinct: true,
            col: 'C_ID',
            where: { Status: 'Active' }
        });

        console.log(`✓ Customer summary: ${customerSales.length} customers retrieved`);

        return res.status(200).json({
            success: true,
            data: customerSales,
            pagination: {
                total: total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            },
            message: 'Customer sales summary retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error fetching customer sales summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching customer summary',
            error: error.message
        });
    }
};

/**
 * getSalesBySaleType()
 * 
 * PURPOSE: Compare retail vs wholesale sales
 * Used for: Business mix analysis, pricing strategy
 * 
 * ENDPOINT: GET /api/sales-management/analytics/by-type
 * 
 * RETURNS: Two rows - one for Retail, one for Wholesale:
 *   - Sale_Type
 *   - count: number of transactions
 *   - total: total revenue
 *   - average: average transaction value
 */
const getSalesBySaleType = async (req, res) => {
    try {
        const salesByType = await Sale.findAll({
            attributes: [
                'Sale_Type',
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'total'],
                [Sequelize.fn('AVG', Sequelize.col('Total_Amount')), 'average']
            ],
            where: { Status: 'Active' },
            group: ['Sale_Type'],
            raw: true
        });

        // Format response
        const formattedData = salesByType.map(item => ({
            Sale_Type: item.Sale_Type,
            count: parseInt(item.count) || 0,
            total: parseFloat(item.total) || 0,
            average: parseFloat(item.average) || 0
        }));

        console.log(`✓ Sales by type: ${formattedData.length} types retrieved`);

        return res.status(200).json({
            success: true,
            data: formattedData,
            message: 'Sales by type retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error fetching sales by type:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales by type',
            error: error.message
        });
    }
};

/**
 * ============================================================================
 * SECTION 5: DETAILED REPORTS
 * ============================================================================
 * 
 * These functions generate detailed business reports with multiple dimensions
 */

/**
 * getMonthlySalesReport()
 * 
 * PURPOSE: Daily breakdown of sales for a specific month
 * Used for: Month-end closing, daily tracking, trend analysis
 * 
 * ENDPOINT: GET /api/sales-management/reports/monthly?month=5&year=2026
 * 
 * PARAMETERS:
 *   - month: 1-12 (required)
 *   - year: 2026+ (required)
 * 
 * RETURNS: Array of daily rows with:
 *   - Sale_Date: the day
 *   - count: number of invoices that day
 *   - total: sum of invoice amounts
 *   - received: sum of payments received
 *   - due: outstanding balance for that day
 * 
 * EXAMPLE RESPONSE:
 * [
 *   {
 *     "Sale_Date": "2026-05-01",
 *     "count": "15",
 *     "total": "125000",
 *     "received": "120000",
 *     "due": "5000"
 *   },
 *   {
 *     "Sale_Date": "2026-05-02",
 *     "count": "18",
 *     "total": "156000",
 *     ...
 *   }
 * ]
 */
const getMonthlySalesReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        // Validate inputs
        if (!month || !year || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month or year. Month must be 1-12'
            });
        }

        // Calculate month boundaries
        const startDate = new Date(year, month - 1, 1);  // First day of month
        const endDate = new Date(year, month, 0, 23, 59, 59);  // Last day of month

        // Query daily aggregates
        const report = await Sale.findAll({
            where: {
                Sale_Date: { [Op.between]: [startDate, endDate] },
                Status: 'Active'
            },
            attributes: [
                'Sale_Date',
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'received'],
                [Sequelize.fn('SUM', Sequelize.col('Balance_Due')), 'due']
            ],
            group: ['Sale_Date'],  // One row per day
            order: [['Sale_Date', 'ASC']],  // Oldest to newest
            raw: true
        });

        console.log(`✓ Monthly report ${year}/${month}: ${report.length} days`);

        return res.status(200).json({
            success: true,
            period: `${year}/${month}`,
            data: report,
            message: 'Monthly sales report fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching monthly sales report:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch monthly sales report',
            error: error.message
        });
    }
};

/**
 * getCompanyItemSalesReport()
 * 
 * PURPOSE: Sales report for "Company" type products only
 * Used for: Company product tracking, separate revenue stream analysis
 * 
 * ENDPOINT: GET /api/sales-management/reports/company-sales?month=5&year=2026
 * 
 * BUG FIX #1:
 * BROKEN: WHERE Sale.P_Type = 'Company' (P_Type doesn't exist on SALES table!)
 * FIXED: Now joins through SALE_ITEM → PRODUCT to filter by P_Type
 * 
 * COMPLEX QUERY EXPLANATION:
 * 1. Join SALE_ITEM (get individual items sold)
 * 2. Join PRODUCT (get product attributes including P_Type)
 * 3. Filter where Product.P_Type = 'Company'
 * 4. Sum only those items' line totals
 * 5. Group by Sale_Date to get daily totals
 * 6. Only include Active sales
 * 
 * RETURNS: Daily breakdown of company-product sales only
 */
const getCompanyItemSalesReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month or year. Month must be 1-12'
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // FIX BUG #1: Join through SALE_ITEM -> PRODUCT
        // This ensures we filter by product type, not sale type
        const report = await SaleItem.findAll({
            attributes: [
                [Sequelize.col('Sale.Sale_Date'), 'Sale_Date'],
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Item_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Line_Total')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('SaleItem.Line_Total')), 'received'],
            ],
            where: {
                '$Sale.Sale_Date$': { [Op.between]: [startDate, endDate] },
                '$Sale.Status$': 'Active',
                '$Product.P_Type$': 'Company'  // Filter by PRODUCT type, not SALES
            },
            include: [
                {
                    model: Sale,
                    attributes: ['Sale_Date'],
                    required: true
                },
                {
                    model: Product,
                    as: 'Product',
                    attributes: ['P_Type'],
                    required: true
                }
            ],
            group: [Sequelize.col('Sale.Sale_Date')],
            order: [[Sequelize.col('Sale.Sale_Date'), 'ASC']],
            subQuery: false,
            raw: true
        });

        console.log(`✓ Company items report ${year}/${month}: ${report.length} days`);

        return res.status(200).json({
            success: true,
            period: `${year}/${month}`,
            type: 'Company',
            data: report,
            message: 'Company item sales report fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching company item sales report:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch company item sales report',
            error: error.message
        });
    }
};

/**
 * getOtherItemSalesReport()
 * 
 * PURPOSE: Sales report for "Other" type products (third-party/resale)
 * Used for: Resale revenue tracking, supplier analysis
 * 
 * ENDPOINT: GET /api/sales-management/reports/other-sales?month=5&year=2026
 * 
 * BUG FIX #2:
 * BROKEN: WHERE Sale.P_Type = 'Other' (P_Type doesn't exist on SALES table!)
 * FIXED: Same as Company report - joins through SALE_ITEM → PRODUCT
 * 
 * Logic is identical to getCompanyItemSalesReport but filters for P_Type = 'Other'
 */
const getOtherItemSalesReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month or year. Month must be 1-12'
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // FIX BUG #2: Join through SALE_ITEM -> PRODUCT
        const report = await SaleItem.findAll({
            attributes: [
                [Sequelize.col('Sale.Sale_Date'), 'Sale_Date'],
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Item_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Line_Total')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('Line_Total')), 'received'],
            ],
            where: {
                '$Sale.Sale_Date$': { [Op.between]: [startDate, endDate] },
                '$Sale.Status$': 'Active',
                '$Product.P_Type$': 'Other'  // Filter by PRODUCT type = 'Other'
            },
            include: [
                {
                    model: Sale,
                    attributes: ['Sale_Date'],
                    required: true
                },
                {
                    model: Product,
                    as: 'Product',
                    attributes: ['P_Type'],
                    required: true
                }
            ],
            group: [Sequelize.col('Sale.Sale_Date')],
            order: [[Sequelize.col('Sale.Sale_Date'), 'ASC']],
            subQuery: false,
            raw: true
        });

        console.log(`✓ Other items report ${year}/${month}: ${report.length} days`);

        return res.status(200).json({
            success: true,
            period: `${year}/${month}`,
            type: 'Other',
            data: report,
            message: 'Other item sales report fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching other item sales report:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch other item sales report',
            error: error.message
        });
    }
};

/**
 * getLocationWiseSalesReport()
 * 
 * PURPOSE: Daily sales breakdown by location (Shop vs Production)
 * Used for: Location performance comparison, multi-store analysis
 * 
 * ENDPOINT: GET /api/sales-management/reports/location-sales?month=5&year=2026&location=Shop
 * 
 * PARAMETERS:
 *   - month, year: required
 *   - location: 'Shop' | 'Production' | 'Main_Warehouse' (required)
 * 
 * RETURNS: Daily sales for specified location only
 */
const getLocationWiseSalesReport = async (req, res) => {
    try {
        const { month, year, location } = req.query;

        if (!month || !year || !location || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month, year, or location. Location: Shop, Production, Main_Warehouse'
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const report = await Sale.findAll({
            where: {
                Sale_Date: { [Op.between]: [startDate, endDate] },
                Status: 'Active',
                Location: location  // Filter by specific location
            },
            attributes: [
                'Sale_Date',
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'received'],
                [Sequelize.fn('SUM', Sequelize.col('Balance_Due')), 'due']
            ],
            group: ['Sale_Date'],
            order: [['Sale_Date', 'ASC']],
            raw: true
        });

        console.log(`✓ Location-wise report ${year}/${month}/${location}: ${report.length} days`);

        return res.status(200).json({
            success: true,
            period: `${year}/${month}`,
            location,
            data: report,
            message: 'Location-wise sales report fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching location-wise sales report:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch location-wise sales report',
            error: error.message
        });
    }
};

/**
 * getLocationSalesBreakdown()
 * 
 * PURPOSE: All-time revenue and transaction count per location
 * Used for: Location comparison charts, regional analysis
 * 
 * ENDPOINT: GET /api/sales-management/analytics/location-breakdown
 * 
 * RETURNS: Array of locations with:
 *   - Location: Shop, Production, Main_Warehouse
 *   - count: total transactions from this location
 *   - totalSales: total revenue from this location
 */
const getLocationSalesBreakdown = async (req, res) => {
    try {
        const breakdown = await Sale.findAll({
            attributes: [
                'Location',
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'totalSales']
            ],
            where: { Status: 'Active' },
            group: ['Location'],
            raw: true
        });

        // Format response
        const formattedData = breakdown.map(item => ({
            Location: item.Location,
            count: parseInt(item.count) || 0,
            totalSales: parseFloat(item.totalSales) || 0
        }));

        console.log(`✓ Location breakdown: ${formattedData.length} locations`);

        return res.status(200).json({
            success: true,
            data: formattedData,
            message: 'Location sales breakdown fetched successfully'
        });

    } catch (error) {
        console.error("❌ Error fetching location sales breakdown:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch location sales breakdown',
            error: error.message
        });
    }
};

/**
 * ============================================================================
 * SECTION 6: WRITE OPERATIONS (NEW - TO BE IMPLEMENTED)
 * ============================================================================
 * 
 * These endpoints handle sale creation, payment processing, and voiding
 * All use database transactions for atomicity
 */

/**
 * createSale() - PLACEHOLDER (TO BE IMPLEMENTED)
 * 
 * PURPOSE: Create new sale with line items and deduct inventory atomically
 * 
 * ENDPOINT: POST /api/sales-management/sales/create
 * 
 * REQUEST BODY:
 * {
 *   "C_ID": 5,
 *   "Location": "Shop",
 *   "Sale_Type": "Retail",
 *   "items": [
 *     {
 *       "P_ID": 10,
 *       "Quantity": 5,
 *       "Unit_Price": 1500
 *     }
 *   ],
 *   "Discount_Amount": 500,
 *   "Tax_Amount": 1200
 * }
 * 
 * LOGIC:
 * 1. Start database transaction
 * 2. Insert SALES record
 * 3. Insert SALE_ITEM records for each item
 * 4. Deduct from INVENTORY for each item
 * 5. Log to STOCK_MOVEMENT
 * 6. Create CREDIT_TRANSACTIONS entry
 * 7. Commit transaction (or rollback if any step fails)
 * 
 * RETURNS: Created sale with Invoice_No
 * 
 * TODO: Implement full logic
 */
const createSale = async (req, res) => {
    // Implementation pending
    return res.status(501).json({
        success: false,
        message: 'POST /sales/create - Coming Soon',
        note: 'This endpoint will create sales with atomic transactions'
    });
};

/**
 * addPaymentToSale() - PLACEHOLDER (TO BE IMPLEMENTED)
 * 
 * PURPOSE: Record payment against existing sale
 * 
 * ENDPOINT: POST /api/sales-management/sales/:id/payment
 * 
 * REQUEST BODY:
 * {
 *   "Payment_Method": "Cash",
 *   "Payment_Amount": 10000,
 *   "Cash_Amount": 10000,
 *   "Cash_Tendered": 10000,
 *   "Cash_Change": 0
 * }
 * 
 * LOGIC:
 * 1. Insert PAYMENT record
 * 2. Update SALES.Paid_Amount += payment amount
 * 3. Update SALES.Balance_Due -= payment amount
 * 4. Update SALES.Payment_Status:
 *    - If Balance_Due = 0: 'Paid'
 *    - If Balance_Due > 0: 'Partially_Paid'
 * 5. Create CREDIT_TRANSACTIONS entry (for ledger)
 * 6. Return updated sale
 * 
 * TODO: Implement full logic
 */
const addPaymentToSale = async (req, res) => {
    // Implementation pending
    return res.status(501).json({
        success: false,
        message: 'POST /sales/:id/payment - Coming Soon',
        note: 'This endpoint will add payments to existing sales'
    });
};

/**
 * voidSale() - PLACEHOLDER (TO BE IMPLEMENTED)
 * 
 * PURPOSE: Void/cancel a sale (reverse all transactions)
 * 
 * ENDPOINT: POST /api/sales-management/sales/:id/void
 * 
 * LOGIC:
 * 1. Validate sale exists and is not already voided
 * 2. Restore inventory for all items
 * 3. Clear all payments
 * 4. Mark SALES.Status = 'Void'
 * 5. Create reversal CREDIT_TRANSACTIONS entry
 * 6. Log to STOCK_MOVEMENT (reversal)
 * 
 * TODO: Implement full logic
 */
const voidSale = async (req, res) => {
    // Implementation pending
    return res.status(501).json({
        success: false,
        message: 'POST /sales/:id/void - Coming Soon',
        note: 'This endpoint will void/cancel existing sales'
    });
};

/**
 * printSale() - PLACEHOLDER (TO BE IMPLEMENTED)
 * 
 * PURPOSE: Mark invoice as printed and log print details
 * 
 * ENDPOINT: POST /api/sales-management/sales/:id/print
 * 
 * LOGIC:
 * 1. Update SALES.Bill_Printed = TRUE
 * 2. Increment SALES.Bill_Print_Count
 * 3. Update SALES.Last_Print_Date = now()
 * 4. If first print: set SALES.First_Print_Date
 * 5. Log to PRINT_QUEUE
 * 6. Return updated sale
 * 
 * TODO: Implement full logic
 */
const printSale = async (req, res) => {
    // Implementation pending
    return res.status(501).json({
        success: false,
        message: 'POST /sales/:id/print - Coming Soon',
        note: 'This endpoint will handle bill printing'
    });
};

/**
 * ============================================================================
 * MODULE EXPORTS
 * ============================================================================
 */

module.exports = {
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

    // Section 4: Analytics & Reporting
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

    // Section 6: Write Operations (Placeholders)
    createSale,
    addPaymentToSale,
    voidSale,
    printSale
};
