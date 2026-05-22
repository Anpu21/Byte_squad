const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const UnitConversion = sequelize.define('UnitConversion', {
    U_ID: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    P_ID: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    Unit_Name: { 
        type: DataTypes.STRING(50), 
        allowNull: false,
        comment: 'Packet, Card, Bundle, Pallet, Bottle, Box, Kg, etc.' 
    },
    Unit_Conversion: { 
        type: DataTypes.DECIMAL(10, 3), 
        allowNull: false,
        comment: 'Conversion to base unit (base=1, card=10, bundle=100)' 
    },
    Is_Base_Unit: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    Display_Order: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0,
        comment: 'For sorting in UI' 
    }
}, {
    tableName: 'unit_conversion',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: false
});

module.exports = UnitConversion;
