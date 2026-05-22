'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            const table = await queryInterface.describeTable('product');
            
            if(!table.Expire_Date){
                await queryInterface.addColumn('product', 'Expire_Date', {
                    type: Sequelize.DATE,
                    allowNull: true,
                    comment: 'Product expiration/shelf life date - required for Company (Ishara), Other, and Raw items'
                });
                console.log('Expire_Date column added to product table');
            } else {
                console.log('Expire_Date column already exists');
            }
        } catch (error) {
            console.error('Error adding Expire_Date column back:', error);
            throw error;
        }
    },
    down: async (queryInterface, Sequelize) => {
        try {
            const table = await queryInterface.describeTable('product');
            
            if(table.Expire_Date){
                await queryInterface.removeColumn('product', 'Expire_Date');
                console.log('Expire_Date column removed successfully from product table');
            } else {
                console.log('Expire_Date column does not exist');
            }
        } catch (error) {
            console.error('Error removing Expire_Date column:', error);
            throw error;
        }
    },
};


//npx sequelize-cli db:migrate
//npx sequelize-cli db:migrate:undo