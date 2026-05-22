// Compatibility wrapper for older inventory imports.
// The Supplier model lives in ../supplier/Supplier so Sequelize only defines it once.
module.exports = require('../supplier/Supplier');
