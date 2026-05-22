const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Module = sequelize.define('Module', {
    Module_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Module_Key: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Unique slug — used in JWT, e.g. "pos"'
    },
    Module_Name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Human label — e.g. "Point of Sale"'
    },
    Icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Icon name for sidebar UI'
    },
    Sort_Order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Controls sidebar display order'
    },
    Is_Active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Soft-disable without deleting'
    }
}, {
    tableName: 'MODULE',
    timestamps: false
});

module.exports = Module;
