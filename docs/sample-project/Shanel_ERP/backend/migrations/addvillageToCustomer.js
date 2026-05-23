//migration file to add village column to customer table
'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('customer', 'Village', {
            type: Sequelize.STRING(100),
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('customer', 'Village');
    }
};

// ALTER TABLE customer
// ADD COLUMN Village VARCHAR(100);

// ALTER TABLE customer
// ADD COLUMN Balance FLOAT;