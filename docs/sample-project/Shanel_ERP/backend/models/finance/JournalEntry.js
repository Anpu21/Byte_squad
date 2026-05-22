const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class JournalEntry extends Model {}

JournalEntry.init({
    Journal_ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Journal_No: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
    },
    Entry_Date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    Entry_Type: {
        type: Sequelize.ENUM('Manual', 'Auto', 'Adjustment', 'Closing'),
        defaultValue: 'Manual'
    },
    Reference_Type: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    Reference_ID: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Description: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    Total_Debit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
    },
    Total_Credit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
    },
    Status: {
        type: Sequelize.ENUM('Draft', 'Posted', 'Cancelled', 'Revised'),
        defaultValue: 'Draft'
    },
    Posted_By: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Posted_Date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    Created_By: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Created_At: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    Updated_At: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize: databaseCon,
    tableName: 'JOURNAL_ENTRY',
    timestamps: false
});

module.exports = JournalEntry;
