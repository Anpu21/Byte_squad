/**
 * Dev-only: rebuild the database from the Sequelize model definitions.
 * DROPS every table managed by a model and recreates it.
 * Run bootstrapAuth.js after this to recreate the admin user.
 * Safe to re-run — but always destroys data.
 */
require('dotenv').config();
require('../models');                 // load every model + associations
const sequelize = require('../config/db');

(async () => {
    try {
        console.log('Rebuilding schema from models via sync({ force: true }) ...');
        await sequelize.sync({ force: true });
        console.log('Sync complete.');
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err.message);
        if (err.parent) console.error('Underlying:', err.parent.sqlMessage || err.parent.message);
        process.exit(1);
    }
})();
