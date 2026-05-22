const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Product = sequelize.define(
    "Product",
    {
        P_ID: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true },

        P_Code: { 
            type: DataTypes.STRING(50), 
            unique: true, 
            allowNull: true },

        P_Name: { 
            type: DataTypes.STRING(200), 
            allowNull: false },

        P_Type: {
            type: DataTypes.ENUM("Company", "Other", "Raw"),
            allowNull: false,
        },

        Base_Unit: { 
            type: DataTypes.STRING(50), 
            allowNull: false },

        Status: {
            type: DataTypes.ENUM("In Stock", "Low Stock", "Out of Stock"),
            defaultValue: "In Stock",
        },

        Cost_Price: { 
            type: DataTypes.DECIMAL(10, 2), 
            defaultValue: 0.0 },

        Retail_Price: { 
            type: DataTypes.DECIMAL(10, 2), 
            allowNull: false },

        Wholesale_Price: { 
            type: DataTypes.DECIMAL(10, 2), 
            allowNull: false },
            
        Min_Stock: { 
            type: DataTypes.DECIMAL(10, 2), 
            defaultValue: 0.0 },

        Max_Stock: { 
            type: DataTypes.DECIMAL(10, 2), 
            allowNull: true },

        Reorder_Level: { 
            type: DataTypes.DECIMAL(10, 2), 
            allowNull: true },

        Tax_Rate: { 
            type: DataTypes.DECIMAL(5, 2), 
            defaultValue: 0.0 },

        P_Name_Sinhala: { 
            type: DataTypes.STRING(200), 
            allowNull: true },

        Category: { 
            type: DataTypes.STRING(100), 
            allowNull: true },

        Subcategory: { 
            type: DataTypes.STRING(100), 
            allowNull: true },

        Description: { 
            type: DataTypes.TEXT, 
            allowNull: true },

        Image_Path: { 
            type: DataTypes.STRING(255), 
            allowNull: true },

        Weight: { 
            type: DataTypes.DECIMAL(10, 3), 
            allowNull: true },

        Weight_Unit: { 
            type: DataTypes.STRING(20), 
            allowNull: true },

        Barcode: { 
            type: DataTypes.STRING(100), 
            allowNull: true },

        Barcode_Type: { 
            type: DataTypes.STRING(20), 
            allowNull: true },

        Auto_Generate_Barcode: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: false },

        Created_By: { 
            type: DataTypes.INTEGER, 
            allowNull: true },

        S_ID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'supplier',
                key: 'S_ID'
            }
        },

        Is_Ishara_Product: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: false,
            comment: 'For Company items: if true, product is supplied directly (Ishara) - no production batch needed. If false, product goes through production batch.' },
    },
    {
        tableName: "product",
        timestamps: true,
        createdAt: "Created_At",
        updatedAt: "Updated_At",
    },
);

module.exports = Product;
