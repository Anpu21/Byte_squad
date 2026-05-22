// this migration is to add Phone column to User table
'use strict';

module.exports = {

    //run when executing the migration
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('USER');
        if (!tableInfo.Phone) {
            await queryInterface.addColumn('USER', 'Phone', {
                type: Sequelize.STRING(20),
                allowNull: true,
                comment: 'Phone number'
            });
        }
    },

    //run when rolling back the migration - undoes the changes made by 'up' method
    down: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('USER');
        if (tableInfo.Phone) {
            await queryInterface.removeColumn('USER', 'Phone');
        }
    }
};

// npx sequelize-cli db:migrate --to migration-file-name.js
