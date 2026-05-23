const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');   

const Payment = sequelize.define('Payment',{
    Pay_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Sale_ID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    
    // ==================== TRANSACTION BASICS ====================
    Payment_Date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    Payment_Time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    Receipt_No: {
        type: DataTypes.STRING(30),
        allowNull: true,
        unique: true
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Void'),
        defaultValue: 'Active'
    },
    
    // ==================== PAYMENT AMOUNT & METHOD ====================
    Payment_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total amount paid towards invoice',
        get() {
            return parseFloat(this.getDataValue('Payment_Amount'));
        }
    },
    Payment_Method: {
        type: DataTypes.ENUM('Cash', 'Cheque', 'Bank_Transfer', 'Credit', 'Mixed', 'Pending'),
        allowNull: false,
        comment: 'Single method or Multiple methods (Mixed)'
    },
    Invoice_Total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Total invoice amount at time of payment',
        get() {
            return parseFloat(this.getDataValue('Invoice_Total'));
        }
    },
    
    // ==================== CASH PAYMENT ====================
    Cash_Tendered: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Amount customer handed over in cash',
        get() {
            return parseFloat(this.getDataValue('Cash_Tendered'));
        }
    },
    Cash_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Amount applied from cash to invoice',
        get() {
            return parseFloat(this.getDataValue('Cash_Amount'));
        }
    },
    Cash_Change: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Change returned to customer',
        get() {
            return parseFloat(this.getDataValue('Cash_Change'));
        }
    },
    
    // ==================== CHEQUE PAYMENT ====================
    Cheque_No: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Cheque number'
    },
    Cheque_Date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Cheque date'
    },
    Cheque_Bank: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Bank name on cheque'
    },
    Cheque_Branch: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Branch name on cheque'
    },
    Cheque_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Amount on cheque',
        get() {
            return parseFloat(this.getDataValue('Cheque_Amount'));
        }
    },
    Cheque_Delivered_By: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Person who delivered the cheque'
    },
    Cheque_Status: {
        type: DataTypes.ENUM('Pending', 'Cleared', 'Bounced'),
        defaultValue: 'Pending',
        allowNull: true,
        comment: 'Cheque clearing status'
    },
    Cleared_Date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Date cheque was cleared'
    },
    Cheque_Ref: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Reference/memo on cheque'
    },
    
    // ==================== BANK TRANSFER ====================
    Bank_Transfer_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Amount transferred via bank',
        get() {
            return parseFloat(this.getDataValue('Bank_Transfer_Amount'));
        }
    },
    Bank_Name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Bank name for transfer'
    },
    Bank_Branch: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Branch name for transfer'
    },
    Bank_Ref: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Bank transaction reference/UTR'
    },
    
    // ==================== CREDIT/BALANCE ====================
    Credit_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Amount kept as customer credit',
        get() {
            return parseFloat(this.getDataValue('Credit_Amount'));
        }
    },
    Keep_Balance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Flag: customer chose to keep remaining as balance'
    },
    Credit_Ref: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Credit note reference'
    },
    
    // ==================== RECEIPT ====================
    Receipt_Printed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Flag: receipt has been printed'
    },
    Receipt_Print_Date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when receipt was printed'
    },
    
    // ==================== ADDITIONAL INFO ====================
    Received_By: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID who processed payment'
    },
    Notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Payment notes/remarks'
    }

},{
    tableName:'payment',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt:false
})

module.exports = Payment;