const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class Bank extends Model {}

Bank.init({
    bank_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bank_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
    },
    bank_code: {
        type: Sequelize.STRING(10),
        allowNull: true
    }
}, {
    sequelize: databaseCon,
    modelName: 'Bank',
    tableName: 'banks',
    timestamps: false
});

module.exports = Bank;
