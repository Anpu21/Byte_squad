const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class Branch extends Model {}

Branch.init({
    branch_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bank_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    branch_name: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    branch_code: {
        type: Sequelize.STRING(10),
        allowNull: true
    }
}, {
    sequelize: databaseCon,
    modelName: 'Branch',
    tableName: 'branches',
    timestamps: false
});

module.exports = Branch;
