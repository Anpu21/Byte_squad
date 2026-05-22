const { Supplier } = require('../../models');

// Get all active suppliers
exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.findAll({
            where: { Status: 'Active' },
            order: [['S_Name', 'ASC']]
        });
        res.json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).json({ success: false, message: "Failed to fetch suppliers", error: error.message });
    }
};

// Create a new supplier inline
exports.createSupplier = async (req, res) => {
    try {
        const { 
            S_Name, Contact_Person, Phone_No, Phone_No_2, Email, Address, City, 
            Country, Payment_Terms, Credit_Limit, Current_Balance, Tax_ID, 
            Bank_Name, Bank_Account_No, Bank_Branch, Status, Rating, Notes 
        } = req.body;
        
        if (!S_Name) {
            return res.status(400).json({ success: false, message: "Supplier name is required" });
        }

        // Auto-generation of next code if not provided
        let finalCode = req.body.S_Code;
        if (!finalCode) {
            const count = await Supplier.count();
            finalCode = `SUP-${(count + 1).toString().padStart(3, '0')}`;
        }

        const newSupplier = await Supplier.create({
            S_Code: finalCode,
            S_Name,
            Contact_Person,
            Phone_No,
            Phone_No_2,
            Email: Email || null,
            Address,
            City,
            Country: Country || 'Sri Lanka',
            Payment_Terms,
            Credit_Limit: Credit_Limit || 0,
            Current_Balance: Current_Balance || 0,
            Tax_ID,
            Bank_Name,
            Bank_Account_No,
            Bank_Branch,
            Status: Status || 'Active',
            Rating,
            Notes
        });

        res.status(201).json({
            success: true,
            message: "Supplier created successfully",
            data: newSupplier
        });

    } catch (error) {
        console.error("Error creating supplier:", error);
        res.status(500).json({ success: false, message: "Failed to create supplier", error: error.message });
    }
};
