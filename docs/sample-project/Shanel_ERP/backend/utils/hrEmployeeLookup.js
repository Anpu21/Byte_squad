/**
 * Resolve route param that may be numeric Employee_ID or Employee_Code string.
 * Lazy-require models to avoid circular dependency during startup.
 */
async function findEmployeeByParam(idOrCode) {
    const { Employee } = require('../models/index');
    const raw = String(idOrCode).trim();
    if (/^\d+$/.test(raw)) {
        const byPk = await Employee.findByPk(parseInt(raw, 10));
        if (byPk) return byPk;
    }
    return Employee.findOne({ where: { Employee_Code: raw } });
}

module.exports = { findEmployeeByParam };
