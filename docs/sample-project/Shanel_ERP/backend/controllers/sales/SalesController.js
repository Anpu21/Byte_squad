const sequelize = require('../../config/db');
const { Product, UnitConversion, Sale, Inventory, Customer, Payment, SaleItem, CreditTranscation, StockMovement } = require('../../models/index');
const { Op, where } = require('sequelize');

const searchProducts = async (req, res) => {

    try {

        const { q, Limit = 10 } = req.query;


        if (!q || q.trim() === '') {
            return res.status(200).json({
                success: true,
                message: "query is empty",
                products: [],
            })
        }

        const searchTerm = q.trim();

        //check search term in sinhala or english language and search accordingly
        const isSinhala = /^[\u0D80-\u0DFF]+$/.test(searchTerm);

        if (isSinhala) {
            // Search by Sinhala name
            const products = await Product.findAll({
                where: {
                    P_Name_Sinhala: { [Op.like]: `${searchTerm}%` }
                }, attributes: [
                    'P_ID',
                    'P_Name',
                    'P_Code',
                    'P_Type',
                    'Base_Unit',
                    'Status',
                    'Cost_Price',
                    'Retail_Price',
                    'Wholesale_Price',
                    'Min_Stock',
                    'Tax_Rate',
                    'Image_Path'

                ], limit: parseFloat(Limit),
                order: [['P_Name', 'ASC']]
            });

            const formateData = products.map((p) => {
                return {
                    p_id: p.P_ID,
                    p_name: p.P_Name,
                    p_code: p.P_Code,
                    p_type: p.P_Type,
                    base_unit: p.Base_Unit,
                    status: p.Status,
                    cost_price: parseFloat(p.Cost_Price),
                    retail_price: parseFloat(p.Retail_Price),
                    wholesale_price: parseFloat(p.Wholesale_Price),
                    min_stock: parseFloat(p.Min_Stock),
                    tax_rate: parseFloat(p.Tax_Rate),
                    image_path: p.Image_Path
                }
            });

            //show retrive data in the console
            console.log("Search Products Result (Sinhala):", formateData);

            return res.status(200).json({
                success: true,
                products: formateData,
                count: formateData.length
            });
        }

        // Search by English name or code


        const products = await Product.findAll({
            where: {
                [Op.or]: [
                    { P_Name: { [Op.like]: `${searchTerm}%` } },
                    { P_Code: { [Op.like]: `${searchTerm}%` } }
                ]
            }, attributes: [
                'P_ID',
                'P_Name',
                'P_Code',
                'P_Type',
                'Base_Unit',
                'Status',
                'Cost_Price',
                'Retail_Price',
                'Wholesale_Price',
                'Min_Stock',
                'Tax_Rate',
                'Image_Path'

            ], limit: parseFloat(Limit),
            order: [['P_Name', 'ASC']]




        })

        const formateData = products.map((p) => {
            return {
                p_id: p.P_ID,
                p_name: p.P_Name,
                p_code: p.P_Code,
                p_type: p.P_Type,
                base_unit: p.Base_Unit,
                status: p.Status,
                cost_price: parseFloat(p.Cost_Price),
                retail_price: parseFloat(p.Retail_Price),
                wholesale_price: parseFloat(p.Wholesale_Price),
                min_stock: parseFloat(p.Min_Stock),
                tax_rate: parseFloat(p.Tax_Rate),
                image_path: p.Image_Path
            }
        })

        //show retrive data in the console
        console.log("Search Products Result:", formateData);

        return res.status(200).json({

            success: true,
            products: formateData,
            count: formateData.length
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "server error while searching products",
            error: error.message
        })



    }
}

//for the dropdown in the POS
const allUnits = async (req, res) => {
    try {
        const { productId } = req.query;
        console.log('Fetching units for product ID:', productId);

        const units = await UnitConversion.findAll({
            where: {
                P_ID: productId
            },
            attributes: [
                'Unit_Name',
                'Is_Base_Unit',
                'Unit_Conversion'
            ],
            order: [['Display_Order', 'ASC']],
            raw: true
        });

        console.log('Units found:', units);

        return res.status(200).json({
            success: true,
            units: units
        });

    } catch (error) {
        console.error('Units fetch error:', error);
        return res.status(500).json({
            success: false,
            message: "server error while fetching units",
            error: error.message
        });
    }
};


// For converting a given unit to the base unit quantity for a specific product
const getBaseUnitQty = async (req, res) => {
    try {
        const { productId, unitName } = req.query;

        const conversion = await UnitConversion.findOne({
            where: {
                P_ID: productId,
                Unit_Name: unitName
            },
            raw: true
        });

        if (conversion) {
            return res.json({
                success: true,
                conversionQty: parseFloat(conversion.Unit_Conversion),
                isBase: conversion.Is_Base_Unit
            });
        }

        return res.json({
            success: false,
            message: "No conversion found"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const generateInvoiceNo = async (req, res) => {
    try {
        let newInvoiceNo;
        const currentYear = new Date().getFullYear();
        
        // Find the most recent sale
        const lastSale = await Sale.findOne({
            order: [['Created_At', 'DESC']]
        });

        let nextSequence = 1;

        if (lastSale) {
            const lastInvoiceNo = lastSale.Invoice_No;
            console.log("Last Invoice No found in DB:", lastInvoiceNo);
            
            // Try to match the standard format: INV-YYYY-XXXXXX
            const standardMatch = lastInvoiceNo.match(/^INV-(\d{4})-(\d+)$/);
            
            if (standardMatch) {
                const yearPart = parseInt(standardMatch[1], 10);
                const sequencePart = parseInt(standardMatch[2], 10);
                
                if (yearPart === currentYear) {
                    nextSequence = sequencePart + 1;
                } else {
                    // New year, reset sequence
                    nextSequence = 1;
                }
            } else {
                // Fallback: If it doesn't match the standard format, try to extract any trailing number
                const trailingNumberMatch = lastInvoiceNo.match(/(\d+)$/);
                if (trailingNumberMatch) {
                    nextSequence = parseInt(trailingNumberMatch[1], 10) + 1;
                } else {
                    // No numbers found at all, just start at 1
                    nextSequence = 1;
                }
            }
        }

        // Format: INV-YYYY-000001 (standardizing to 6 digits for the sequence part)
        newInvoiceNo = `INV-${currentYear}-${String(nextSequence).padStart(6, '0')}`;
        
        console.log("Generated New Invoice No:", newInvoiceNo);

        return res.status(200).json({
            invoiceNo: newInvoiceNo,
            success: true,
            message: "Invoice number generated successfully"
        });
    } catch (error) {
        console.error("Error in generateInvoiceNo:", error);
        return res.status(500).json({
            success: false,
            message: "Error generating invoice number",
            error: error.message
        });
    }
}


//post sales data from POS to backend
const postSalesData = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { customer: customerReq, items, invoiceDetails, paymentDetails, action, saleType, priceLevel, location } = req.body;
        const createdBy = req.user?.sub;

        if (!createdBy) {
            await t.rollback();
            return res.status(401).json({ success: false, message: 'Authenticated user id is required' });
        }


        const resolvedSaleType = saleType || invoiceDetails?.saleType || 'Retail';
        const resolvedPriceLevel = priceLevel || invoiceDetails?.priceLevel || 'Retail';

        console.log("Processing POS Sale:", {
            invoiceNo: invoiceDetails?.invoiceNo,
            customerID: customerReq?.c_id,
            total: invoiceDetails?.finalTotal,
            paid: paymentDetails?.Payment_Amount
        });

        // Basic Validation
        if (!customerReq || !customerReq.c_id) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "Customer data is required" });
        }
        if (!items || !items.length) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "Cart cannot be empty" });
        }

        const now = new Date();
        const saleDate = invoiceDetails?.invoiceDate || now.toISOString().split('T')[0];
        const saleTime = invoiceDetails?.invoiceTime || now.toTimeString().split(' ')[0];
        
        const invoiceTotal = parseFloat(invoiceDetails?.finalTotal || 0);
        const paymentAmount = parseFloat(paymentDetails?.Payment_Amount || 0);
        
        // Calculate Payment Status and Balance Due for the Sale record
        let salePaymentStatus = 'Paid';
        let saleBalanceDue = 0;
        if (paymentAmount < invoiceTotal) {
            salePaymentStatus = paymentAmount > 0 ? 'Partially_Paid' : 'Unpaid';
            saleBalanceDue = invoiceTotal - paymentAmount;
        }

        // 1. Create Sale Record
        const sale = await Sale.create({
            Invoice_No: invoiceDetails.invoiceNo,
            C_ID: customerReq.c_id,
            Sale_Date: saleDate,
            Sale_Time: saleTime,
            Location: location || invoiceDetails?.location || 'Shop',
            Sale_Type: resolvedSaleType,

            Price_Level: resolvedPriceLevel,
            Subtotal: parseFloat(invoiceDetails.subTotal || 0),
            Discount_Percentage: parseFloat(invoiceDetails.discountPercentage || 0),
            Discount_Amount: parseFloat(invoiceDetails.discountAmount || 0),
            Tax_Rate: 0,
            Tax_Amount: parseFloat(invoiceDetails.taxTotal || 0),
            Total_Amount: invoiceTotal,
            Payment_Status: salePaymentStatus,
            Paid_Amount: Math.min(paymentAmount, invoiceTotal), // Capped at invoice total for the sale record
            Balance_Due: saleBalanceDue,
            Bill_Printed: false,
            Status: 'Active'
        }, { transaction: t });

        // 2. Create Payment Record (detailed breakdown)
        const payment = await Payment.create({
            Sale_ID: sale.Sale_Id,
            Payment_Date: saleDate,
            Payment_Time: saleTime,
            Receipt_No: `RCPT-${sale.Sale_Id}`,
            Status: 'Active',
            Payment_Method: paymentDetails?.Payment_Method || 'Cash',
            Payment_Amount: paymentAmount,
            Invoice_Total: invoiceTotal,
            Cash_Tendered: parseFloat(paymentDetails?.Cash_Tendered || 0),
            Cash_Amount: parseFloat(paymentDetails?.Applied_Value || 0),
            Cash_Change: parseFloat(paymentDetails?.Change || 0),
            Cheque_Amount: parseFloat(paymentDetails?.Cheque_Amount || 0),
            Bank_Transfer_Amount: parseFloat(paymentDetails?.Bank_Transfer_Amount || 0),
            Credit_Amount: parseFloat(paymentDetails?.Credit_Amount || 0),
            Keep_Balance: paymentDetails?.Keep_Balance || false,
            Cheque_Ref: paymentDetails?.Cheque_Ref || null,
            Bank_Ref: paymentDetails?.Bank_Ref || null,
            Cheque_No: paymentDetails?.Cheque_No || '',
            Cheque_Date: paymentDetails?.Cheque_Date || null,
            Cheque_Bank: paymentDetails?.Cheque_Bank || '',
            Cheque_Branch: paymentDetails?.Cheque_Branch || '',
            Cheque_Delivered_By: paymentDetails?.Cheque_Delivered_By || ''
        }, { transaction: t });

        // 3. Update Customer Balance and Credit Transactions
        const customer = await Customer.findByPk(customerReq.c_id, { transaction: t });
        if (!customer) throw new Error("Customer profile not found");

        let currentCustomerBalance = parseFloat(customer.Current_Balance || 0);

        // Scenario A: Credit Taken (Amount not paid now)
        if (parseFloat(paymentDetails.Credit_Amount) > 0) {
            const creditTaken = parseFloat(paymentDetails.Credit_Amount);
            currentCustomerBalance += creditTaken;
            
            await CreditTranscation.create({
                Customer_ID: customerReq.c_id,
                Sale_ID: sale.Sale_Id,
                Transaction_Date: saleDate,
                Transaction_Type: 'Credit_Taken',
                Amount: creditTaken,
                Running_Balance: currentCustomerBalance,
                Reference_No: `CR-${sale.Sale_Id}`,
                Notes: `Credit taken for invoice ${sale.Invoice_No}`
            }, { transaction: t });
        }

        // Scenario B: Overpayment applied to customer account (Keep Balance)
        if (paymentDetails.Keep_Balance && paymentAmount > invoiceTotal) {
            const overpayment = paymentAmount - invoiceTotal;
            currentCustomerBalance -= overpayment; // Allow negative balance (this is customer credit)
            
            await CreditTranscation.create({
                Customer_ID: customerReq.c_id,
                Sale_ID: sale.Sale_Id,
                Pay_ID: payment.Pay_ID,
                Transaction_Date: saleDate,
                Transaction_Type: 'Credit_Paid',
                Amount: overpayment,
                Running_Balance: currentCustomerBalance,
                Reference_No: `OVERPAY-${sale.Sale_Id}`,
                Notes: `Overpayment from invoice ${sale.Invoice_No} kept as customer balance`
            }, { transaction: t });
        }

        // Update the final customer balance
        await customer.update({ Current_Balance: currentCustomerBalance }, { transaction: t });

        // 4. Process Sale Items and Inventory
        const saleItemsData = await Promise.all(items.map(async (item) => {
            const qty = parseFloat(item.quntity ?? item.quantity ?? 0);
            
            // Find correct unit for conversion
            let unit = await UnitConversion.findOne({
                where: { P_ID: item.p_id, Unit_Name: item.p_unit || item.unit || null },
                transaction: t
            });
            if (!unit) {
                unit = await UnitConversion.findOne({
                    where: { P_ID: item.p_id, Is_Base_Unit: true },
                    transaction: t
                });
            }

            const unitConversion = parseFloat(unit?.Unit_Conversion ?? item.conversionFactor ?? 1);
            const baseUnitQty = qty * unitConversion;

            // Calculate line discount amount from quantity, price, and discount percentage
            const unitPrice = parseFloat(item.unit_price || 0);
            const discountPercentage = parseFloat(item.discount || 0);
            const lineDiscountAmount = (qty * unitPrice) * (discountPercentage / 100);

            // Prepare SaleItem record
            const saleItem = {
                Sale_ID: sale.Sale_Id,
                P_ID: item.p_id,
                U_ID: unit?.U_ID ?? 1,
                Quantity: qty,
                Base_Unit_Qty: baseUnitQty,
                Unit_Price: unitPrice,
                Price_Level_Used: resolvedPriceLevel,
                Line_Discount_Percentage: discountPercentage,
                Line_Discount_Amount: lineDiscountAmount,
                Line_Subtotal: parseFloat(item.subTotal || 0),
                Line_Tax_Rate: parseFloat(item.tax || 0),
                Line_Tax_Amount: parseFloat(item.taxAmount || 0),
                Line_Total: parseFloat(item.total || 0),
                Location_Taken_From: location || invoiceDetails?.location || 'Shop',
                Status: 'Active',
            };


            // Strict Inventory Update
            const inventoryRecord = await Inventory.findOne({
                where: { 
                    P_ID: item.p_id, 
                    Location: saleItem.Location_Taken_From 
                },
                transaction: t
            });

            if (!inventoryRecord) {
                throw new Error(`Item '${item.p_name || item.p_code}' not found in ${saleItem.Location_Taken_From} inventory.`);
            }

            const currentQty = parseFloat(inventoryRecord.Qty || 0);
            if (currentQty < baseUnitQty) {
                throw new Error(`Insufficient stock for '${item.p_name || item.p_code}' in ${saleItem.Location_Taken_From}. Available: ${currentQty}, Requested: ${baseUnitQty}`);
            }

            await inventoryRecord.decrement('Qty', { 
                by: baseUnitQty, 
                transaction: t 
            });

            const updatedQtyAfterSale = currentQty - baseUnitQty;

            await StockMovement.create({
                P_ID: item.p_id,
                PR_ID: item.pr_id || null,
                Location: saleItem.Location_Taken_From,
                Movement_Type: 'Sale',
                Qty_In: 0,
                Qty_Out: baseUnitQty,
                Balance_After: updatedQtyAfterSale,
                Ref_Type: 'Sales',
                Ref_ID: sale.Sale_Id,
                Move_Date: saleDate,
                Move_Time: saleTime,
                Notes: `Sale invoice ${sale.Invoice_No} - ${item.p_name || item.p_code || 'Item'}`,
                Created_By: createdBy
            }, { transaction: t });



            return saleItem;
        }));

        // Bulk create SaleItems
        await SaleItem.bulkCreate(saleItemsData, { transaction: t });

        // 5. Commit Transaction
        await t.commit();

        console.log(`Sale successfully processed: ${sale.Invoice_No}`);

        return res.status(200).json({
            success: true,
            message: "Sale processed successfully",
            invoiceNo: sale.Invoice_No,
            saleId: sale.Sale_Id
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error("Critical Error in postSalesData:", error);
        
        res.status(500).json({
            success: false,
            message: error.message || "A critical error occurred while processing the sale.",
            error: error.name
        });
    }
}





//  get the quntity of product in the inventory 
const getProductQuntity = async (req, res) => {
    try {
        const { productId } = req.params;
        console.log('Fetching quantity for product:', productId);
        

        //total quntity in shop location
        const shopInventory = await Inventory.findOne({
            where: {
                P_ID: productId,
                Location: 'Shop'
            },
            attributes: ['Qty']
        });

        const productionInventory = await Inventory.findOne({
            where: {
                P_ID: productId,
                Location: 'Production'
            },
            attributes: ['Qty']
        });

        const shopQty = parseFloat(shopInventory?.Qty) || 0;
        const productionQty = parseFloat(productionInventory?.Qty) || 0;

        const totalQty = shopQty + productionQty;
       
        console.log(`Shop quantity: ${shopQty}, Production quantity: ${productionQty}, Total quantity for product ID ${productId}:`, totalQty);
        
        res.status(200).json({
            success: true,
            productId: productId,
            shopQty: shopQty,
            productionQty: productionQty,
           totalQty: totalQty 
        });

    } catch (error) {
        console.error("Error fetching product quantity from inventory:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching product quantity"
        });
    }
};


//get all sales for recent activity log in the POS
const getAllSales = async (req, res) => {
    try {
        const sales = await Sale.findAll({
            where: {
                Status: 'Active',
                Sale_Date: {
                    [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
                }
            },
            attributes: [

                'Invoice_No',
                'C_ID',
                'Sale_Date',
                'Sale_Time',
                'Total_Amount',
                'Paid_Amount',
                'Payment_Status'
            ], include: [{
                model: Customer,
                attributes: ['C_Name']
            }], order: [['Created_At', 'DESC']]

        });


        const formateData = sales.map((s) => {
            return {
                invoice_no: s.Invoice_No,
                c_id: s.C_ID,
                customer_name: s.Customer?.C_Name || 'Unknown',
                sale_date: s.Sale_Date,
                sale_time: s.Sale_Time,
                total_amount: parseFloat(s.Total_Amount),
                balance: parseFloat(s.Total_Amount) - parseFloat(s.Paid_Amount),
                payment_status: s.Payment_Status
            }
        }
        );

        return res.status(200).json({
            success: true,
            count: sales.length,
            data: formateData

        });
    } catch (error) {
        console.error('getAllSales error: ', error);
        return res.status(500).json({
            success: false,
            message: 'server error while fetching sales',
            error: error.message
        })
    }

}         

const updateBillPrintStatus = async (req, res) => {
    try {
        const { invoiceNo } = req.params;
        const { printed } = req.body;

        if (!invoiceNo) {
            return res.status(400).json({ success: false, message: "Invoice number is required" });
        }

        const sale = await Sale.findOne({ where: { Invoice_No: invoiceNo } });

        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale not found" });
        }

        const updateData = {
            Bill_Printed: !!printed,
            Bill_Print_Count: (sale.Bill_Print_Count || 0) + 1,
            Last_Print_Date: new Date()
        };

        if (!sale.First_Print_Date) {
            updateData.First_Print_Date = new Date();
        }

        await sale.update(updateData);

        return res.status(200).json({
            success: true,
            message: "Bill print status updated successfully",
            printCount: updateData.Bill_Print_Count
        });
    } catch (error) {
        console.error("Error in updateBillPrintStatus:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating bill print status",
            error: error.message
        });
    }
}

module.exports = { searchProducts, allUnits, getBaseUnitQty, postSalesData, generateInvoiceNo ,getProductQuntity,getAllSales, updateBillPrintStatus};


