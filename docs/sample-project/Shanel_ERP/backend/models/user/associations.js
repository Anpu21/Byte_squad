const User = require('./User');
const Module = require('./Module');
const UserModuleAccess = require('./UserModuleAccess');
const UserToken = require('./UserToken');

const setupUserAssociations = () => {
    // User <-> UserModuleAccess
    User.hasMany(UserModuleAccess, { foreignKey: 'User_ID', as: 'ModuleAccess' });
    UserModuleAccess.belongsTo(User, { foreignKey: 'User_ID', as: 'User' });

    // Module <-> UserModuleAccess
    Module.hasMany(UserModuleAccess, { foreignKey: 'Module_ID', as: 'UserAccess' });
    UserModuleAccess.belongsTo(Module, { foreignKey: 'Module_ID', as: 'Module' });

    // UserModuleAccess <-> User (Granted_By)
    User.hasMany(UserModuleAccess, { foreignKey: 'Granted_By', as: 'GrantedAccess' });
    UserModuleAccess.belongsTo(User, { foreignKey: 'Granted_By', as: 'Granter' });

    // User <-> UserToken
    User.hasMany(UserToken, { foreignKey: 'User_ID', as: 'Tokens' });
    UserToken.belongsTo(User, { foreignKey: 'User_ID', as: 'User' });
};

module.exports = setupUserAssociations;
