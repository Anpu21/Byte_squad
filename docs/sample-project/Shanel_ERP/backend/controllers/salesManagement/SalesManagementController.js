const sequelize = require("../../config/db");
const { count } = require("../../models/finance/AccountChart");

const { Sale, SaleItem, Payment, Customer, Product, UnitConversion, CreditTranscation } = require('../../models/index');
const { Op, Sequelize } = require("sequelize");


// ============================================================================
// SECTION 1: TODAY'S METRICS & DASHBOARD
// ============================================================================


// Get today's metrics (Sales, Revenue, Discount, Tax, Count)
// Returns aggregated data for dashboard cards

const getTodayMetrics = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

        const metrics = await Sale.findAll({
            where: {
                Sale_Date: {
                    [Op.between]: [today, tomorrow]
                }
            }, attributes: [
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'totalSales'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'totalRevenue'],
                [Sequelize.fn('SUM', Sequelize.col('Discount_Amount')), 'totalDiscount'],
                [Sequelize.fn('SUM', Sequelize.col('Tax_Amount')), 'totalTax'],
                [Sequelize.fn('COUNT', Sequelize.col('Sale_ID')), 'salesCount']
            ], raw: true// Get raw result for easier access

        });

        const data = metrics[0] || {};// Handle case when no sales today, return empty object with 0 values
        console.log("Today's Metrics:", data); // Debug log

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
        console.error("Error fetching today's metrics:", error);
        return res.status(500).json({ success: false, message: 'Failed to fetch today\'s metrics', error: error.message });
    }
}

// ============================================================================
// SECTION 2: SALES HISTORY & RETRIEVAL
// ============================================================================

/**
 * Get sales history with pagination and proper associations
 */
const getSalesHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Sale.findAndCountAll({
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1', 'Email', 'Customer_Type']
                }, {
                    model: SaleItem,
                    as: 'SaleItems',
                    attributes: ['Sale_Item_Id', 'P_ID', 'Quantity', 'Unit_Price', 'Line_Total']

                },{
                    model:Payment,
                    as:'Payments',
                    attributes: ['Pay_ID', 'Payment_Method', 'Payment_Amount', 'Payment_Date']
                }
            ],attributes:[
                'Sale_Id',
                'Invoice_No',
                'Sale_Date',
                'Sale_Time',
                'Location',
                'Sale_Type',
                'Price_Level',
                'Subtotal',
                'Discount_Amount',
                'Tax_Amount',
                'Total_Amount',
                'Payment_Status',
                'Paid_Amount',
                'Balance_Due',
                'Bill_Printed',
                'Notes',
                'Status'
            ],where: { Status: 'Active' }, // Only fetch active sales
            order: [['Sale_Date', 'DESC'], ['Sale_Time', 'DESC']], // Latest sales first
            limit: parseInt(limit),
            offset: offset,
            raw: false // Get full model instances for associations

        })

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit),
                limit: parseInt(limit)
            },//used for frontend pagination controls {prev, next, total pages}
            message: "Sales history fetched successfully"
        });

    } catch (error) {
        console.error("Error fetching sales history:", error);
        return res.status(500).json({
             success: false,
              message: 'Failed to fetch sales history',
               error: error.message 
            });
    }
}

/**
 * Get sale details by ID with all related data
 * Used for viewing/editing a specific sale
 */
const getSaleDetails = async (req, res) => {
    try{
        const {saleId} = req.params;

        if(!saleId || isNaN(saleId)){
            return res.status(400).json({success:false, message:'Invalid sale ID'});
        }

        const sale = await  Sale.findByPk(saleId, {
            include:[
                {
                    model:Customer,
                    as:'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1', 'Phone2', 'Email', 'Address', 'Customer_Type', 'Credit_Limit', 'Current_Balance']
                },{
                    model:SaleItem,
                    as:'SaleItems',
                    include:[
                        {
                            model: Product,
                            as: 'Product',
                            attributes: ['P_ID', 'P_Name', 'P_Code', 'Base_Unit', 'Retail_Price', 'Wholesale_Price']
                        },
                        {
                            model: UnitConversion,
                            as: 'Unit',
                            attributes: ['U_ID', 'Unit_Name', 'Unit_Conversion']
                        }
                    ],
                },{
                    model:Payment,
                    as:'Payments',
                     attributes: ['Pay_ID', 'Payment_Method', 'Payment_Amount', 'Payment_Date', 'Payment_Time', 'Status']
                }
            ]
        });

        if(!sale){
            return res.status(404).json({success:false, message:'Sale not found'});
        }

        return res.status(200).json({
            success:true, 
            data:sale, 
            message:'Sale details fetched successfully'});
    }catch(error){
        console.error("Error fetching sale details:", error);
        return res.status(500).json({success:false, message:'Failed to fetch sale details', error: error.message});
    }
}

/**
 * Get sale items by sale ID
 */
const getSaleItemsBySaleId = async (req,res) => {
    try{
        const {saleId} = req.params;
        if(!saleId || isNaN(saleId)){
            return res.status(400).json({success:false, message:'Invalid sale ID'});
        }

        const saleItems = await SaleItem.findAll({
            where:{Sale_ID: saleId},
                include:[
                    {
                        model: Product,
                        as: 'Product',
                        attributes: ['P_ID', 'P_Name', 'P_Code', 'Base_Unit', 'Retail_Price', 'Wholesale_Price']
                    },{
                        model: UnitConversion,
                        as: 'Unit',
                        attributes: ['U_ID', 'Unit_Name', 'Unit_Conversion']
                    }
                ]
        });

        if(!saleItems || saleItems.length === 0){
            return res.status(404).json({
                success:false, 
                message:'No items found for this sale'});
        }

        return res.status(200).json({
            success:true, 
            data:saleItems, 
            count: saleItems.length,
            message:'Sale items fetched successfully'});

    }catch(error){
        console.error("Error fetching sale items:", error);
        return res.status(500).json({
            success:false,
             message:'Failed to fetch sale items',
              error: error.message});
    }
};

// ============================================================================
// SECTION 3: ADVANCED SEARCH & FILTERING
// ============================================================================

/**
 * Search sales by multiple criteria (customer name, date, invoice no)
 */
const searchSales = async (req, res) => {
    try {
        const { query, startDate, endDate, paymentStatus, location, productType, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = { Status: 'Active' }; // Only search active sales

        // Text search
        if (query && query.trim()) {
            where[Op.or] = [
                { Invoice_No: { [Op.like]: `%${query}%` } }
            ];
        }

        // Location filter
        if (location && ['Shop', 'Production', 'Main_Warehouse'].includes(location)) {
            where.Location = location;
        }

        // Payment status filter
        if (paymentStatus && ['Paid', 'Unpaid', 'Partially_Paid'].includes(paymentStatus)) {
            where.Payment_Status = paymentStatus;
        }

        // Product Type filter (Assume P_Type exists in database)
        if (productType && ['Company', 'Other'].includes(productType)) {
            where.P_Type = productType;
        }

        // Date range filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.Sale_Date = {
                [Op.between]: [start, end]
            };
        } else if (startDate) {
            where.Sale_Date = { [Op.gte]: new Date(startDate) };
        } else if (endDate) {
            where.Sale_Date = { [Op.lte]: new Date(endDate) };
        }

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
                }, {
                    model: Payment,
                    as: 'Payments',
                    attributes: ['Pay_ID', 'Payment_Method', 'Payment_Amount', 'Payment_Date']
                }
            ],
            order: [['Sale_Date', 'DESC'], ['Sale_Time', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            subQuery: false // Important for correct pagination with includes
        });

        console.log("**Debug - Search Sales Result Count:", count); // Debug log

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
        console.error("Error searching sales:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search sales',
            error: error.message
        });
    }

}

/**
 * Get top selling products in a specific period (week/month/year)
 */
const getTopSellingProducts = async (req, res) => {
    try{
        const {limit = 10, period ='month'} = req.query;
        const today = new Date();

        let startDate;
        switch(period){

            case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7); // Last 7 days
            break;

            case 'month':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1); // Last month
            break;

            case 'year':
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1); // Last year
            break;

            default:
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1); // Default to last month
         }
        
        const topProducts = await SaleItem.findAll({
            attributes:[
                'P_ID',
                [Sequelize.fn('SUM', Sequelize.col('Quantity')), 'totalQuantity'],
                [Sequelize.fn('SUM', Sequelize.col('Line_Total')), 'totalRevenue'],
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Item_Id')), 'salesCount']
            ],
            where:{
                '$Sale.Sale_Date$': {
                    [Op.gte]: startDate // Greater than or equal to start date 
                    },
                '$Sale.Status$': 'Active' // Only consider active sales
            },include:[
                {
                    model: Sale,
                    attributes:['Sale_Date'],
                    required: true // Inner join to ensure we only get items from sales that match the date criteria
                },
                {
                    model: Product,
                    as: 'Product',
                    attributes: ['P_ID', 'P_Name',  'P_Code', 'Base_Unit', 'Retail_Price']
                }
            ],
            group: ['P_ID'], // Group by product ID to aggregate sales
            order: [[Sequelize.literal('totalRevenue'), 'DESC']], // Order by total revenue
            limit: parseInt(limit), // Limit the number of results
            subQuery: false ,// Important for correct grouping and ordering with includes
            raw:true // Get raw result for easier access to aggregated fields
         });

         const formattedProducts = topProducts.map(p => ({
            P_ID: p.P_ID,
            Product_Name: p['Product.P_Name'],
            Product_Code: p['Product.P_Code'],
            totalQuantity: parseFloat(p.totalQuantity) || 0,
            totalRevenue: parseFloat(p.totalRevenue) || 0,
            salesCount: parseInt(p.salesCount) || 0
         }));

         return res.status(200).json({
            success:true, 
            period,
            data:formattedProducts,
            count: formattedProducts.length,
            message:'Top selling products fetched successfully'
         });

       
        
    }catch(error){
        console.error("Error fetching top selling products:", error);
        return res.status(500).json({
            success:false,
                message:'Failed to fetch top selling products', 
                error: error.message
        });
    }
}

/**
 * Get payment method breakdown for a specific period
 */
const getPaymentMethodBreakdown = async (req, res) => {
    try{
        const {period = 'month'} = req.query;
        const today = new Date();
        const startDate = new Date(today).setMonth(today.getMonth() - 1); // Default to last month
        
        const breakdown = await Payment.findAll({
            attributes:[
                'Payment_Method',
                [Sequelize.fn('COUNT', Sequelize.col('Pay_ID')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Payment_Amount')), 'total']
            ],
            where:{
                '$Sale.Sale_Date$': {
                    [Op.gte]: new Date(startDate)
                },
                '$Sale.Status$': 'Active'
            },
            include:[
                {
                    model: Sale,
                    attributes:['Sale_Date'],
                    required: true
                }
            ],
            group: ['Payment_Method'],
            order: [[Sequelize.literal('total'), 'DESC']],
            subQuery: false,
            raw: true
        });

        return res.status(200).json({
            success:true,
            data: breakdown,
            message:'Payment method breakdown fetched successfully'
        });
    }catch(error){
        console.error("Error fetching payment method breakdown:", error);
        return res.status(500).json({
            success:false,
            message:'Failed to fetch payment method breakdown',
            error: error.message
        });
    }
}

/**
 * Get due/pending payments
 */
const getDueSales = async (req, res) => {
    try{
        const {page = 1, limit = 20} = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const {count , rows} = await Sale.findAndCountAll({
            where:{
                Payment_Status: {
                    [Op.in]: ['Unpaid', 'Partially_Paid'] // Select records where the value is either 'Unpaid' OR 'Partially_Paid'
                },
                Status: 'Active'
            },
            include:[
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['C_ID', 'C_Name', 'Phone1', 'Email', 'Customer_Type']
                }
            ],attributes:[
                'Sale_Id',
                'Invoice_No',
                'Sale_Date',
                'Total_Amount',
                'Paid_Amount',
                'Balance_Due',
                'Due_Date',
                'Payment_Status'
            ],
            order: [['Due_Date', 'ASC']], // Oldest dues first
            limit: parseInt(limit),
            offset: offset,
            raw: false
         });
  
         console.log("**Debug - Due Sales Count:", count); // Debug log
            return res.status(200).json({
                success:true,
                data: rows,
                pagination:{
                    total: count,
                    page: parseInt(page),
                    pages: Math.ceil(count / limit),
                },
                message:'Due sales fetched successfully'
            });
    }catch(error){
        console.error("Error fetching due sales:", error);
        return res.status(500).json({
            success:false,
            message:'Failed to fetch due sales',
            error: error.message
        });
    }   
}

// ============================================================================
// SECTION 5: DETAILED REPORTS
// ============================================================================

/**
 * Get monthly sales report
 */
const getMonthlySalesReport = async (req, res) => {
    try{
        const {month,year} = req.query;

        if(!month || !year || isNaN(month) || isNaN(year) || month < 1 || month > 12){
            return res.status(400).json({success:false, message:'Invalid month or year'});
        }

        const startDate = new Date(year, month - 1, 1); // First day of the month, new Date(2026, 5, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month, new Date(2026, 5, 30, 23, 59, 59)
   
        const report = await Sale.findAll({
            where:{
                Sale_Date: {
                    [Op.between]: [startDate, endDate]
                },
                Status: 'Active'
             },
             attributes:[
                'Sale_Date',
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'received'],

                [Sequelize.fn('SUM', Sequelize.col('Balance_Due')), 'due'],
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'salesCount']
             ],
             group: ['Sale_Date'], // Group by sale date to get daily totals
             order: [['Sale_Date', 'ASC']], // Oldest to newest
             raw: true
           });
           console.log("**Debug - Monthly Sales Report Count:", report.length); // Debug log

        return res.status(200).json({
            success:true,
            period:`${year}/${month}`,
            data: report,
            message:'Monthly sales report fetched successfully'
        });
    }catch(error){
        console.error("Error fetching monthly sales report:", error);
        return res.status(500).json({
            success:false,
            message:'Failed to fetch monthly sales report',
            error: error.message
        });
    }
}

/**
 * Get company item sales report
 */
const getCompanyItemSalesReport = async (req, res) => {
    try{
        const {month, year} = req.query;

        if(!month || !year || isNaN(month) || isNaN(year) || month < 1 || month > 12){
            return res.status(400).json({success:false, message:'Invalid month or year'});
        }

       const startDate = new Date(year, month - 1, 1); // First day of the month, new Date(2026, 5, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month, new Date(2026, 5, 30, 23, 59, 59)
    
        const report = await Sale.findAll({
            where:{
                Sale_Date: {
                    [Op.between]: [startDate, endDate]
                },
                Status: 'Active',
                P_Type: 'Company'
               
            },attributes:[
                'Sale_Date',
                 [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'received'],
                [Sequelize.fn('SUM', Sequelize.col('Balance_Due')), 'due']
            ],
            group: ['Sale_Date'], // Group by sale date to get daily totals
            order: [['Sale_Date', 'ASC']], // Oldest to newest
            raw: true
        });
        return res.status(200).json({
            success:true,
            period:`${year}/${month}`,
            data: report,
            message:'Company item sales report fetched successfully'
        });
    }catch(error){
        console.error("Error fetching company item sales report:", error);
        return res.status(500).json({
            success:false,
            message:'Failed to fetch company item sales report',
            error: error.message
        });
    }
}
 
/**
 * Get other item sales report
 */
const getOtherItemSalesReport = async (req, res) => {
    try{
        const {month, year} = req.query;
        if(!month || !year || isNaN(month) || isNaN(year) || month < 1 || month > 12){
            return res.status(400).json({success:false, message:'Invalid month or year'});
        }
        const startDate = new Date(year, month - 1, 1); // First day of the month, new Date(2026, 5, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month, new Date(2026, 5, 30, 23, 59, 59)
        const report = await Sale.findAll({
            where:{
                Sale_Date: {
                    [Op.between]: [startDate, endDate]
                },
                Status: 'Active',
                P_Type: 'Other'
            },attributes:[
                'Sale_Date',
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'received'],
                [Sequelize.fn('SUM', Sequelize.col('Balance_Due')), 'due']
            ],
            group: ['Sale_Date'], // Group by sale date to get daily totals
            order: [['Sale_Date', 'ASC']], // Oldest to newest
            raw: true
        });
        return res.status(200).json({
            success:true,
            period:`${year}/${month}`,
            data: report,
            message:'Other item sales report fetched successfully'
        });
    }catch(error){
        console.error("Error fetching other item sales report:", error);
        return res.status(500).json({   
            success:false,
            message:'Failed to fetch other item sales report',
            error: error.message
        });
    }
}

/**
 * Get location wise sales report
 */
const getLocationWiseSalesReport = async (req, res) => {
    try{
        const {month, year, location} = req.query;
        if(!month || !year || !location || isNaN(month) || isNaN(year) || month < 1 || month > 12){
            return res.status(400).json({success:false, message:'Invalid month, year, or location'});
        }
        const startDate = new Date(year, month - 1, 1); // First day of the month, new Date(2026, 5, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month, new Date(2026, 5, 30, 23, 59, 59)
        const report = await Sale.findAll({
            where:{
                Sale_Date: {
                    [Op.between]: [startDate, endDate]
                },
                Status: 'Active',
                Location: location
            },attributes:[
                'Sale_Date',
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('Paid_Amount')), 'received'],
                [Sequelize.fn('SUM', Sequelize.col('Balance_Due')), 'due']
            ],
            group: ['Sale_Date'], // Group by sale date to get daily totals
            order: [['Sale_Date', 'ASC']], // Oldest to newest
            raw: true
        });
        return res.status(200).json({
            success:true,
            period:`${year}/${month}`,
            location,
            data: report,
            message:'Location-wise sales report fetched successfully'
        });
    }catch(error){
        console.error("Error fetching location-wise sales report:", error);
        return res.status(500).json({
            success:false,
            message:'Failed to fetch location-wise sales report',
            error: error.message
        });
    }


}

/**
 * Get sales performance metrics
 * Calculates:
 * - Total customers in the system
 * - How many customers bought something today
 * - Total sales today
 * - Average bill value (ticket size)
 * - Conversion rate (how many customers actually purchased)
 */
const getSalesPerformanceMetrics = async (req, res) => {
    try{
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total customers in the system
        const totalCustomers = await Customer.count();

        // Today's active customers
        const todaysCustomers = await Sale.count({
            distinct: true,
             col: 'C_ID',
              where: {
                Sale_Date: today,
                Status: 'Active'
              }
        });

        // Today's sales metrics
        const todayMetrics = await Sale.findAll({
            where: {
                Sale_Date: today,
                Status: 'Active'
            },attributes:[
                [Sequelize.fn('COUNT', Sequelize.col('Sale_Id')), 'salesCount'],
                [Sequelize.fn('SUM', Sequelize.col('Total_Amount')), 'totalSales'],
                [Sequelize.fn('AVG', Sequelize.col('Total_Amount')), 'averageBillValue']
            ],raw: true
        });

        const data = todayMetrics[0] || {}; // Handle case when no sales today, return empty object with 0 values
        const conversionRate = totalCustomers > 0 ? (todaysCustomers / totalCustomers) * 100 : 0; // Conversion rate = (active customers / total customers) × 100

        console.log("**Debug Sales Performance Metrics:", {
            totalCustomers,
            todaysCustomers,
            conversionRate: `${conversionRate.toFixed(2)}%`,
            totalSales: parseFloat(data.totalSales) || 0,
            averageBillValue: parseFloat(data.averageBillValue) || 0,
            todayTransactionCount: parseInt(data.salesCount) || 0
        }); // Debug log
        return res.status(200).json({
            success:true,
            data:{
                totalCustomers,
                todayActiveCustomers: todaysCustomers,
                conversionRate : `${conversionRate.toFixed(2)}%`, // Format as percentage with 2 decimal places
                totalSales: parseFloat(data.totalSales) || 0,
                averageBillValue: parseFloat(data.averageBillValue) || 0,
                todayTransactionCount: parseInt(data.salesCount) || 0
            },
            message:'Sales performance metrics fetched successfully'
        });
    }catch(error){
        console.error("Error fetching sales performance metrics:", error);
        return res.status(500).json({
            success:false,
            message:'Failed to fetch sales performance metrics',
            error: error.message
        });
    }
}

/**
 * Get sales breakdown by location (for charts)
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

        const formattedData = breakdown.map(item => ({
            Location: item.Location,
            count: parseInt(item.count) || 0,
            totalSales: parseFloat(item.totalSales) || 0
        }));

        return res.status(200).json({
            success: true,
            data: formattedData,
            message: 'Location sales breakdown fetched successfully'
        });
    } catch (error) {
        console.error("Error fetching location sales breakdown:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch location sales breakdown',
            error: error.message
        });
    }
}

// ============================================================================
// SECTION 3: ADVANCED SEARCH & FILTERING
// ============================================================================

/**
 * Filter sales by date range
 */
const filterSalesByDateRange = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 20 } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

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
        console.error('Error filtering by date range:', error);
        return res.status(500).json({
            success: false,
            message: 'Error filtering sales',
            error: error.message
        });
    }
};

/**
 * Filter sales by payment status (Paid, Unpaid, Partially_Paid)
 */
const getSalesByPaymentStatus = async (req, res) => {
    try {
        const { paymentStatus, page = 1, limit = 20 } = req.query;

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
        console.error('Error fetching sales by payment status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales',
            error: error.message
        });
    }
};

/**
 * Filter sales by location
 */
const getSalesByLocation = async (req, res) => {
    try {
        const { location, page = 1, limit = 20 } = req.query;

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
        console.error('Error fetching sales by location:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales',
            error: error.message
        });
    }
};

// ============================================================================
// SECTION 4: ANALYTICS & REPORTING
// ============================================================================

/**
 * Get sales metrics for a specific time period (week/month/year)
 */
const getSalesMetricsByPeriod = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const today = new Date();
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
                return res.status(400).json({
                    success: false,
                    message: 'Invalid period. Valid options: week, month, year'
                });
        }

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
        console.error('Error fetching period metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching metrics',
            error: error.message
        });
    }
};

/**
 * Get customer-wise sales summary
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
                    attributes: ['C_ID', 'C_Name', 'Phone1', 'Customer_Type', 'Total_Purchases'],
                    required: true
                }
            ],
            group: ['C_ID'],
            order: [[Sequelize.literal('totalSpent'), 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            subQuery: false,
            raw: true
        });

        const total = await Sale.count({
            distinct: true,
            col: 'C_ID',
            where: { Status: 'Active' }
        });

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
        console.error('Error fetching customer sales summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching customer summary',
            error: error.message
        });
    }
};

/**
 * Get sales by sale type (Retail/Wholesale)
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

        return res.status(200).json({
            success: true,
            data: salesByType,
            message: 'Sales by type retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching sales by type:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales by type',
            error: error.message
        });
    }
};

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
    // Today's Metrics
    getTodayMetrics,

    // Sales History
    getSalesHistory,
    getSaleDetails,
    getSaleItemsBySaleId,

    // Search & Filter
    searchSales,
    filterSalesByDateRange,
    getSalesByPaymentStatus,
    getSalesByLocation,

    // Analytics
    getSalesMetricsByPeriod,
    getTopSellingProducts,
    getCustomerSalesSummary,
    getPaymentMethodBreakdown,
    getSalesBySaleType,
    getDueSales,

    // Reports
    getMonthlySalesReport,
    getCompanyItemSalesReport,
    getOtherItemSalesReport,
    getLocationWiseSalesReport,
    getSalesPerformanceMetrics,
    getLocationSalesBreakdown
};

 