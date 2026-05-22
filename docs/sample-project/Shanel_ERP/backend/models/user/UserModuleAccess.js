const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const UserModuleAccess = sequelize.define('UserModuleAccess', {
    Access_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    User_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'USER',
            key: 'User_ID'
        }
    },
    Module_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'MODULE',
            key: 'Module_ID'
        }
    },
    Granted_By: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'USER',
            key: 'User_ID'
        },
        comment: 'Admin who assigned (audit trail)'
    },
    Granted_At: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'USER_MODULE_ACCESS',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['User_ID', 'Module_ID']
        }
    ]
});

module.exports = UserModuleAccess;
