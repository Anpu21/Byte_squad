'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Adding Cheque_Ref column to payment table...');
      
      const tableInfo = await queryInterface.describeTable('payment');
      if (!tableInfo.Cheque_Ref) {
        await queryInterface.addColumn('payment', 'Cheque_Ref', {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Reference for cheque payment',
          after: 'Cheque_Delivered_By'
        });
        console.log('✅ Cheque_Ref column added successfully!');
      } else {
        console.log('⚠️ Cheque_Ref column already exists, skipping...');
      }
    } catch (error) {
      console.error('❌ Error adding Cheque_Ref column:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Removing Cheque_Ref column from payment table...');
      
      await queryInterface.removeColumn('payment', 'Cheque_Ref');
      
      console.log('✅ Cheque_Ref column removed successfully!');
    } catch (error) {
      console.error('❌ Error removing Cheque_Ref column:', error.message);
      throw error;
    }
  }
};
