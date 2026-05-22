'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingTables = await queryInterface.showAllTables();
    const tableExists = (tableName) => existingTables.some(
      existing => String(existing).toLowerCase() === tableName.toLowerCase()
    );

    // 1. Create MODULE table
    if (!tableExists('MODULE')) {
      await queryInterface.createTable('MODULE', {
        Module_ID: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        Module_Key: {
          type: Sequelize.STRING(50),
          unique: true,
          allowNull: false
        },
        Module_Name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        Icon: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        Sort_Order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        Is_Active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        }
      });
    }

    // 2. Create USER_MODULE_ACCESS table
    if (!tableExists('USER_MODULE_ACCESS')) {
      await queryInterface.createTable('USER_MODULE_ACCESS', {
        Access_ID: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        User_ID: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'USER',
            key: 'User_ID'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        Module_ID: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'MODULE',
            key: 'Module_ID'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        Granted_By: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'USER',
            key: 'User_ID'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        Granted_At: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false
        }
      });

      // Add unique constraint to USER_MODULE_ACCESS
      await queryInterface.addIndex('USER_MODULE_ACCESS', ['User_ID', 'Module_ID'], {
        unique: true,
        name: 'unique_user_module'
      });
    }

    // 3. Create USER_TOKEN table
    if (!tableExists('USER_TOKEN')) {
      await queryInterface.createTable('USER_TOKEN', {
        Token_ID: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        User_ID: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'USER',
            key: 'User_ID'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        Refresh_Token: {
          type: Sequelize.STRING(512),
          allowNull: false
        },
        Device_Info: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        IP_Address: {
          type: Sequelize.STRING(45),
          allowNull: true
        },
        Expires_At: {
          type: Sequelize.DATE,
          allowNull: false
        },
        Revoked: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        Revoked_At: {
          type: Sequelize.DATE,
          allowNull: true
        },
        Created_At: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    // 4. Update USER table if necessary (Remove Phone and Employee_ID if they exist)
    // We'll use a try-catch or check columns to avoid errors if they don't exist
    const tableInfo = await queryInterface.describeTable('USER');
    if (tableInfo.Phone) {
      await queryInterface.removeColumn('USER', 'Phone');
    }
    if (tableInfo.Employee_ID) {
      await queryInterface.removeColumn('USER', 'Employee_ID');
    }

    // 5. Seed MODULE table
    await queryInterface.bulkInsert('MODULE', [
      { Module_Key: 'dashboard',       Module_Name: 'Dashboard',       Icon: 'dashboard',   Sort_Order: 1, Is_Active: true },
      { Module_Key: 'pos',             Module_Name: 'Point of Sale',   Icon: 'pos',         Sort_Order: 2, Is_Active: true },
      { Module_Key: 'inventory',       Module_Name: 'Inventory',       Icon: 'inventory',   Sort_Order: 3, Is_Active: true },
      { Module_Key: 'production',      Module_Name: 'Production',      Icon: 'production',  Sort_Order: 4, Is_Active: true },
      { Module_Key: 'sales',           Module_Name: 'Sales',           Icon: 'sales',       Sort_Order: 5, Is_Active: true },
      { Module_Key: 'finance',         Module_Name: 'Finance',         Icon: 'finance',     Sort_Order: 6, Is_Active: true },
      { Module_Key: 'reports',         Module_Name: 'Reports',         Icon: 'reports',     Sort_Order: 7, Is_Active: true },
      { Module_Key: 'user_management', Module_Name: 'User Management', Icon: 'users',       Sort_Order: 8, Is_Active: true }
    ], {
      updateOnDuplicate: ['Module_Name', 'Icon', 'Sort_Order', 'Is_Active']
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('USER_TOKEN');
    await queryInterface.dropTable('USER_MODULE_ACCESS');
    await queryInterface.dropTable('MODULE');

    // Note: We don't restore Phone/Employee_ID in down as they were existing data we're moving away from, 
    // but in a real scenario you might want to.
  }
};
