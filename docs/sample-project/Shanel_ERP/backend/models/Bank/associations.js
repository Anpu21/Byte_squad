const Bank = require('./Bank');
const Branch = require('./Branch');

// ── Bank <──> Branch ───────────────────────────────────────────────────────
Bank.hasMany(Branch, {
    foreignKey: 'bank_id',
    as: 'Branches'
});

Branch.belongsTo(Bank, {
    foreignKey: 'bank_id',
    as: 'Bank'
});

module.exports = { Bank, Branch };
