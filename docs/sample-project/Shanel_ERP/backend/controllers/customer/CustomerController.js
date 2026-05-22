const { Customer } = require('../../models/index');
const { Op, where } = require('sequelize');


//get all customers
const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            where: { Status: 'Active' },
            attributes: [

                'C_ID',
                'Customer_Code',
                'C_Name',
                'Phone1',
                'Customer_Type',
                'Price_Level',
                'Credit_Allowed',
                'Current_Balance',
                'Credit_Limit',
                'Status'
            ], order: [['C_Name', 'ASC']]
        })

        return res.status(200).json({
            success: true,
            count: customers.length,
            data: customers

        });
    } catch (error) {
        console.error('gellAllCustomer error: ', error);
        return res.status(500).json({
            success: false,
            message: 'server error while fetching customer',
            error: error.message
        })
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findOne({
            where: {
                Customer_Code: req.params.id,
                Status: 'Active'
            }
        })

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'customer not found'

            })
        }

        return res.status(200).json({
            success: true,
            data: customer
        })
    } catch (error) {

        console.error('getCustomerById error: ', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        })


    }
}

const searchCustomers = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;


        // Return an empty list for blank search text to avoid noisy frontend errors.
        if (!q || q.trim() === '') {
            return res.status(200).json({
                success: true,
                count: 0,
                customers: []
            });
        }

        const searchTerm = q.trim();

        const customer = await Customer.findAll({

            where: {
                Status: 'Active',
                [Op.or]: [
                    { C_Name: { [Op.like]: `${searchTerm}%` } },
                    { Phone1: { [Op.like]: `${searchTerm}%` } },
                    { Phone2: { [Op.like]: `${searchTerm}` } },
                    { Customer_Code: { [Op.like]: `${searchTerm}` } }
                ]
            }, attributes: [
                'C_ID',
                'Customer_Code',
                'C_Name',
                'Phone1',
                'Phone2',
                'Email',
                'Address',
                'City',
                'Customer_Type',
                'Price_Level',
                'Credit_Allowed',
                'Credit_Limit',
                'Current_Balance',
                'Payment_Terms',
                'Status',
                'Last_Purchase_Date',


            ], limit: parseInt(limit),
            order: [['C_Name', 'ASC']],

        });

        const formateData = customer.map((c) => {

            const creditLimit = parseFloat(c.Credit_Limit) || 0;
            const currentBalance = parseFloat(c.Current_Balance) || 0;
            const availableCredit = creditLimit - currentBalance;


            //credit allowed logic
            let creditStatus = 'NOT_ALLOWED'
            if (c.Credit_Allowed) {
                if (c.Current_Balance >= c.Credit_Limit) {
                    creditStatus = 'LIMITE_REACHED';
                } else if (c.Current_Balance >= c.Credit_Limit * 0.8) {
                    creditStatus = 'NEAR_LIMIT';
                } else {
                    creditStatus = 'CREDIT_ALLOWED'
                }
            }
                return {
                    c_id: c.C_ID,
                    customer_code: c.Customer_Code,
                    c_name: c.C_Name,
                    phone1: c.Phone1,
                    phone2: c.Phone2,
                    email: c.Email,
                    address: c.Address,
                    city: c.City,
                    customer_type: c.Customer_Type,
                    price_level: c.Price_Level,
                    credit_allowed: c.Credit_Allowed,
                    credit_limit: creditLimit,
                    current_balance: currentBalance,
                    available_credit: availableCredit,
                    credit_status: creditStatus,
                    payment_terms: c.Payment_Terms,
                    last_purchase_date: c.Last_Purchase_Date,

                }

            

        })
        return res.status(200).json({
            success: true,
            count: formateData.length,
            customers: formateData,
        });
    } catch (error) {
        console.error("error in the server", error);
        return res.status(500).json({
            success: false,
            error: "SERVER_ERROR",
            message: "Something went wrong"
        })
    }

}

const generateUniqueCustomerCode = async () => {
    const prefix = 'CUST';
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${prefix}-${randomPart}`;

    // Check if the generated code already exists in the database
    const exitingCustomer = await Customer.findOne({ where: { Customer_Code: code } });
    if (exitingCustomer) {
        // If code exists, generate a new one recursively
        return await generateUniqueCustomerCode();
    }
    return code;
};

const saveCustomer = async (req,res) => {
    const {
        customer_name,
        contact_person,
        customer_email,
        customer_phone1,
        customer_phone2,
        customer_address,
        customer_city,
        customer_type,
        price_level,
        credit_allowed,
        credit_limit,
        current_balance,
        payment_terms,
        preferred_payment_method,
        tax_id,
        status,
        last_purchase_date,
        total_purchases,
        loyalty_points,
        notes
    } = req.body;

    try{
        // Validation
        if (!customer_name) {
            return res.status(400).json({
                success: false,
                message: 'Customer name is required'
            });
        }

        if (!customer_phone1) {
            return res.status(400).json({
                success: false,
                message: 'Phone number (Phone1) is required'
            });
        }

        // Handle invalid dates - set to null if empty or invalid
        let validLastPurchaseDate = null;
        if (last_purchase_date && last_purchase_date.trim() !== '') {
            const dateObj = new Date(last_purchase_date);
            if (!isNaN(dateObj.getTime())) {
                validLastPurchaseDate = last_purchase_date;
            }
        }

        const newCustomer = await Customer.create({
            Customer_Code: await generateUniqueCustomerCode(),
            C_Name: customer_name,
            Contact_Person: contact_person,
            Email: customer_email,
            Phone1: customer_phone1,            
            Phone2: customer_phone2,
            Address: customer_address,
            City: customer_city,
            Customer_Type: customer_type,
            Price_Level: price_level,
            Credit_Allowed: credit_allowed,
            Credit_Limit: credit_limit,
            Current_Balance: current_balance,
            Payment_Terms: payment_terms,
            Preferred_Payment_Method: preferred_payment_method,
            Tax_ID: tax_id,
            Status: status,
            Last_Purchase_Date: validLastPurchaseDate,
            Total_Purchases: total_purchases || 0,
            Loyalty_Points: loyalty_points || 0,
            Notes: notes
        });

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: newCustomer
        });
        
        console.log('New customer created: ', newCustomer);
    }catch(err){
        console.error('saveCustomer error:', err);
        res.status(500).json({
            success: false,
            message: 'Error creating customer',
            error: err.message
        });
    }
}



module.exports = { getAllCustomers, getCustomerById, searchCustomers ,saveCustomer};