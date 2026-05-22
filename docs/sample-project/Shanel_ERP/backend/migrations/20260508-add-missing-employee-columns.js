'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Adding missing columns to EMPLOYEE table...');
      
      // Check which columns already exist
      const columns = await queryInterface.describeTable('EMPLOYEE');
      const columnNames = Object.keys(columns);
      
      // EPF_Number
      if (!columnNames.includes('EPF_Number')) {
        await queryInterface.addColumn('EMPLOYEE', 'EPF_Number', {
          type: Sequelize.STRING(50),
          allowNull: true,
          after: 'ETF_Eligible'
        });
        console.log('✅ Added EPF_Number column');
      }
      
      // Bank_Name
      if (!columnNames.includes('Bank_Name')) {
        await queryInterface.addColumn('EMPLOYEE', 'Bank_Name', {
          type: Sequelize.STRING(100),
          allowNull: true,
          after: 'EPF_Number'
        });
        console.log('✅ Added Bank_Name column');
      }
      
      // Bank_Account_No
      if (!columnNames.includes('Bank_Account_No')) {
        await queryInterface.addColumn('EMPLOYEE', 'Bank_Account_No', {
          type: Sequelize.STRING(50),
          allowNull: true,
          after: 'Bank_Name'
        });
        console.log('✅ Added Bank_Account_No column');
      }
      
      // Bank_Branch
      if (!columnNames.includes('Bank_Branch')) {
        await queryInterface.addColumn('EMPLOYEE', 'Bank_Branch', {
          type: Sequelize.STRING(100),
          allowNull: true,
          after: 'Bank_Account_No'
        });
        console.log('✅ Added Bank_Branch column');
      }
      
      // Bank_Account_Name
      if (!columnNames.includes('Bank_Account_Name')) {
        await queryInterface.addColumn('EMPLOYEE', 'Bank_Account_Name', {
          type: Sequelize.STRING(200),
          allowNull: true,
          after: 'Bank_Branch'
        });
        console.log('✅ Added Bank_Account_Name column');
      }
      
      // Resignation_Date
      if (!columnNames.includes('Resignation_Date')) {
        await queryInterface.addColumn('EMPLOYEE', 'Resignation_Date', {
          type: Sequelize.DATEONLY,
          allowNull: true,
          after: 'Status'
        });
        console.log('✅ Added Resignation_Date column');
      }
      
      // Resignation_Reason
      if (!columnNames.includes('Resignation_Reason')) {
        await queryInterface.addColumn('EMPLOYEE', 'Resignation_Reason', {
          type: Sequelize.TEXT,
          allowNull: true,
          after: 'Resignation_Date'
        });
        console.log('✅ Added Resignation_Reason column');
      }
      
      // Termination_Date
      if (!columnNames.includes('Termination_Date')) {
        await queryInterface.addColumn('EMPLOYEE', 'Termination_Date', {
          type: Sequelize.DATEONLY,
          allowNull: true,
          after: 'Resignation_Reason'
        });
        console.log('✅ Added Termination_Date column');
      }
      
      // Termination_Reason
      if (!columnNames.includes('Termination_Reason')) {
        await queryInterface.addColumn('EMPLOYEE', 'Termination_Reason', {
          type: Sequelize.TEXT,
          allowNull: true,
          after: 'Termination_Date'
        });
        console.log('✅ Added Termination_Reason column');
      }
      
      // Notes
      if (!columnNames.includes('Notes')) {
        await queryInterface.addColumn('EMPLOYEE', 'Notes', {
          type: Sequelize.TEXT,
          allowNull: true,
          after: 'Termination_Reason'
        });
        console.log('✅ Added Notes column');
      }
      
      // Photo_Path
      if (!columnNames.includes('Photo_Path')) {
        await queryInterface.addColumn('EMPLOYEE', 'Photo_Path', {
          type: Sequelize.STRING(255),
          allowNull: true,
          after: 'Notes'
        });
        console.log('✅ Added Photo_Path column');
      }
      
      // Created_By
      if (!columnNames.includes('Created_By')) {
        await queryInterface.addColumn('EMPLOYEE', 'Created_By', {
          type: Sequelize.INTEGER,
          allowNull: true,
          after: 'Photo_Path'
        });
        console.log('✅ Added Created_By column');
      }
      
      console.log('✅ All missing columns added successfully!');
    } catch (error) {
      console.error('❌ Error adding columns:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Removing added columns from EMPLOYEE table...');
      
      const columns = [
        'EPF_Number', 'Bank_Name', 'Bank_Account_No',
        'Bank_Branch', 'Bank_Account_Name', 'Resignation_Date',
        'Resignation_Reason', 'Termination_Date', 'Termination_Reason',
        'Notes', 'Photo_Path', 'Created_By'
      ];
      
      for (const col of columns) {
        try {
          await queryInterface.removeColumn('EMPLOYEE', col);
          console.log(`✅ Removed ${col} column`);
        } catch (err) {
          // Column may not exist, continue
        }
      }
      
      console.log('✅ Columns removed successfully!');
    } catch (error) {
      console.error('❌ Error removing columns:', error.message);
      throw error;
    }
  }
};
