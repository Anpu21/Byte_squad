'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('customer');
    if (tableInfo.Village) {
      await queryInterface.removeColumn('customer', 'Village');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('customer');
    if (!tableInfo.Village) {
      await queryInterface.addColumn('customer', 'Village', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
  }
};