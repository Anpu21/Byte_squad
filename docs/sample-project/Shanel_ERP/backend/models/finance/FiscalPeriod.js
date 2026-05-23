const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class FiscalPeriod extends Model {}

FiscalPeriod.init({
    Period_ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Period_Name: {
        type: Sequelize.STRING(50),
        allowNull: false
    },
    Start_Date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    End_Date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    Status: {
        type: Sequelize.ENUM('OPEN', 'CLOSED', 'LOCKED'),
        defaultValue: 'OPEN'
    },
    Is_Year_End: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    Created_At: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize: databaseCon,
    tableName: 'FISCAL_PERIOD',
    timestamps: false
});

module.exports = FiscalPeriod;
