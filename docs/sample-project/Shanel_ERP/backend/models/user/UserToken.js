const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const UserToken = sequelize.define('UserToken', {
    Token_ID: {
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
    Refresh_Token: {
        type: DataTypes.STRING(512),
        allowNull: false,
        comment: 'Hashed refresh token (bcrypt)'
    },
    Device_Info: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Optional: browser / device string'
    },
    IP_Address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IPv4 or IPv6 of issuing request'
    },
    Expires_At: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Refresh token expiry (+7 days)'
    },
    Revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    Revoked_At: {
        type: DataTypes.DATE,
        allowNull: true
    },
    Created_At: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'USER_TOKEN',
    timestamps: false
});

module.exports = UserToken;
