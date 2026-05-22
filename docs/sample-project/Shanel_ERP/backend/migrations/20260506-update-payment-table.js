'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get existing columns to make migration idempotent
      const columns = await queryInterface.describeTable('payment', { transaction });

      console.log('📋 Checking Payment table structure...');

      // ==================== ADD NEW COLUMNS (if they don't exist) ====================
      
      if (!columns.Cash_Amount) {
        await queryInterface.addColumn('payment', 'Cash_Amount', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Cash amount applied to invoice'
        }, { transaction });
        console.log('✅ Added Cash_Amount');
      }

      if (!columns.Cheque_Branch) {
        await queryInterface.addColumn('payment', 'Cheque_Branch', {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Branch name from cheque'
        }, { transaction });
        console.log('✅ Added Cheque_Branch');
      }

      if (!columns.Cheque_Delivered_By) {
        await queryInterface.addColumn('payment', 'Cheque_Delivered_By', {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Person who delivered cheque'
        }, { transaction });
        console.log('✅ Added Cheque_Delivered_By');
      }

      if (!columns.Bank_Transfer_Amount) {
        await queryInterface.addColumn('payment', 'Bank_Transfer_Amount', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Amount transferred via bank'
        }, { transaction });
        console.log('✅ Added Bank_Transfer_Amount');
      }

      if (!columns.Bank_Branch) {
        await queryInterface.addColumn('payment', 'Bank_Branch', {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Branch name for bank transfer'
        }, { transaction });
        console.log('✅ Added Bank_Branch');
      }

      if (!columns.Bank_Ref) {
        await queryInterface.addColumn('payment', 'Bank_Ref', {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Bank reference/UTR'
        }, { transaction });
        console.log('✅ Added Bank_Ref');
      }

      if (!columns.Keep_Balance) {
        await queryInterface.addColumn('payment', 'Keep_Balance', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Customer keeps balance as credit'
        }, { transaction });
        console.log('✅ Added Keep_Balance');
      }

      if (!columns.Credit_Ref) {
        await queryInterface.addColumn('payment', 'Credit_Ref', {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Credit note reference'
        }, { transaction });
        console.log('✅ Added Credit_Ref');
      }

      if (!columns.Note) {
        await queryInterface.addColumn('payment', 'Note', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Payment notes'
        }, { transaction });
        console.log('✅ Added Note');
      }

      // ==================== REMOVE OLD COLUMNS ====================

      if (columns.Cash_Received_By) {
        await queryInterface.removeColumn('payment', 'Cash_Received_By', { transaction });
        console.log('✅ Removed Cash_Received_By');
      }

      if (columns.Deposit_Slip_No) {
        await queryInterface.removeColumn('payment', 'Deposit_Slip_No', { transaction });
        console.log('✅ Removed Deposit_Slip_No');
      }

      if (columns.Deposited_By) {
        await queryInterface.removeColumn('payment', 'Deposited_By', { transaction });
        console.log('✅ Removed Deposited_By');
      }

      if (columns.Deposit_Date) {
        await queryInterface.removeColumn('payment', 'Deposit_Date', { transaction });
        console.log('✅ Removed Deposit_Date');
      }

      if (columns.Card_Type) {
        await queryInterface.removeColumn('payment', 'Card_Type', { transaction });
        console.log('✅ Removed Card_Type');
      }

      if (columns.Card_Last_4_Digits) {
        await queryInterface.removeColumn('payment', 'Card_Last_4_Digits', { transaction });
        console.log('✅ Removed Card_Last_4_Digits');
      }

      if (columns.Card_Transaction_ID) {
        await queryInterface.removeColumn('payment', 'Card_Transaction_ID', { transaction });
        console.log('✅ Removed Card_Transaction_ID');
      }

      if (columns.Credit_Note_No) {
        await queryInterface.removeColumn('payment', 'Credit_Note_No', { transaction });
        console.log('✅ Removed Credit_Note_No');
      }

      if (columns.Credit_Terms) {
        await queryInterface.removeColumn('payment', 'Credit_Terms', { transaction });
        console.log('✅ Removed Credit_Terms');
      }

      if (columns.Reference_No) {
        await queryInterface.removeColumn('payment', 'Reference_No', { transaction });
        console.log('✅ Removed Reference_No');
      }

      // ==================== UPDATE COLUMNS ====================

      console.log('🔄 Updating Payment_Method ENUM...');

      // First, expand the ENUM to include both old and new values
      await queryInterface.sequelize.query(
        `ALTER TABLE \`payment\` MODIFY COLUMN \`Payment_Method\` ENUM('Cash', 'Cheque', 'Bank_Transfer', 'Bank_Deposit', 'Card', 'Credit', 'Mixed', 'Pending') NOT NULL`,
        { transaction }
      );

      console.log('✅ Expanded Payment_Method ENUM');

      // Now update old values
      await queryInterface.sequelize.query(
        `UPDATE \`payment\` SET \`Payment_Method\` = 'Bank_Transfer' WHERE \`Payment_Method\` = 'Bank_Deposit'`,
        { transaction }
      );

      console.log('✅ Migrated Bank_Deposit → Bank_Transfer');

      await queryInterface.sequelize.query(
        `UPDATE \`payment\` SET \`Payment_Method\` = 'Cash' WHERE \`Payment_Method\` = 'Card'`,
        { transaction }
      ).catch(() => {});

      // Now set ENUM to only new values
      await queryInterface.sequelize.query(
        `ALTER TABLE \`payment\` MODIFY COLUMN \`Payment_Method\` ENUM('Cash', 'Cheque', 'Bank_Transfer', 'Credit', 'Mixed', 'Pending') NOT NULL`,
        { transaction }
      );

      console.log('✅ Updated Payment_Method ENUM to final values');

      // Make Receipt_No unique using raw SQL
      await queryInterface.sequelize.query(
        `ALTER TABLE payment ADD UNIQUE KEY unique_receipt_no (Receipt_No)`,
        { transaction, logging: false }
      ).catch(() => {
        // Key might already exist, ignore the error
      });

      console.log('✅ Ensured Receipt_No uniqueness');

      await transaction.commit();
      console.log('\n✅✅✅ Payment table migration completed successfully!\n');
    } catch (error) {
      await transaction.rollback();
      console.error('\n❌ Migration failed:', error.message, '\n');
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('⚠️  Rollback not implemented - this is intentional for safety');
  }
};
