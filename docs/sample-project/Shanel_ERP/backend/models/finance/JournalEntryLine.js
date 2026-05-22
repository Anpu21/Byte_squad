const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class JournalEntryLine extends Model {}

JournalEntryLine.init({
    Line_ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Journal_ID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    Account_ID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    Line_Number: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    Debit_Amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    Credit_Amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    Description: {
        type: Sequelize.STRING(500),
        allowNull: true
    },
    Created_At: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize: databaseCon,
    tableName: 'JOURNAL_ENTRY_LINE',
    timestamps: false
});

module.exports = JournalEntryLine;
