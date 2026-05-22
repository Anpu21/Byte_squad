'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get existing columns
      const columns = await queryInterface.describeTable('payment', { transaction });

      console.log('📋 Adding missing payment fields...');

      // Add Credit_Amount if missing
      if (!columns.Credit_Amount) {
        await queryInterface.addColumn('payment', 'Credit_Amount', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Amount issued as customer credit'
        }, { transaction });
        console.log('✅ Added Credit_Amount');
      }

      // Add Cheque_Amount if missing
      if (!columns.Cheque_Amount) {
        await queryInterface.addColumn('payment', 'Cheque_Amount', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Amount on cheque'
        }, { transaction });
        console.log('✅ Added Cheque_Amount');
      }

      // Add Invoice_Total for reference
      if (!columns.Invoice_Total) {
        await queryInterface.addColumn('payment', 'Invoice_Total', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Total invoice amount at time of payment'
        }, { transaction });
        console.log('✅ Added Invoice_Total');
      }

      await transaction.commit();
      console.log('\n✅✅ Missing payment fields added successfully!\n');
    } catch (error) {
      await transaction.rollback();
      console.error('\n❌ Migration failed:', error.message, '\n');
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('⚠️  Rollback not implemented for safety');
  }
};
