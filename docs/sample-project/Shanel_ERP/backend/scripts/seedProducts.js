// const Product = require('../models/inventory/Product');

// const seedProducts = async () => {
//     try {
//         // Check if products already exist
//         const existingCount = await Product.count();
//         if (existingCount > 0) {
//             console.log(`✅ ${existingCount} products already exist. Skipping seed.`);
//             return;
//         }
//         const productsData = [
//             {
//                 P_Name: 'Rice - White',
//                 P_Name_Sinhala: 'සුදු බත',
//                 P_Code: 'RICE001',
//                 P_Type: 'Staple',
//                 Base_Unit: 'KG',
//                 Status: 'Active',
//                 Cost_Price: 45.00,
//                 Retail_Price: 65.00,
//                 Wholesale_Price: 55.00,
//                 Min_Stock: 100,
//                 Tax_Rate: 0,
//                 Description: 'Premium white rice'
//             },
//             {
//                 P_Name: 'Sugar',
//                 P_Name_Sinhala: 'සීනි',
//                 P_Code: 'SUGAR001',
//                 P_Type: 'Staple',
//                 Base_Unit: 'KG',
//                 Status: 'Active',
//                 Cost_Price: 75.00,
//                 Retail_Price: 95.00,
//                 Wholesale_Price: 85.00,
//                 Min_Stock: 50,
//                 Tax_Rate: 0,
//                 Description: 'White granulated sugar'
//             },
//             {
//                 P_Name: 'Oil - Cooking',
//                 P_Name_Sinhala: 'මිශ්‍ර තෙල්',
//                 P_Code: 'OIL001',
//                 P_Type: 'Cooking',
//                 Base_Unit: 'L',
//                 Status: 'Active',
//                 Cost_Price: 180.00,
//                 Retail_Price: 220.00,
//                 Wholesale_Price: 200.00,
//                 Min_Stock: 30,
//                 Tax_Rate: 0,
//                 Description: 'Mixed cooking oil'
//             },
//             {
//                 P_Name: 'Tea Powder',
//                 P_Name_Sinhala: 'තේ කුඩු',
//                 P_Code: 'TEA001',
//                 P_Type: 'Beverages',
//                 Base_Unit: 'KG',
//                 Status: 'Active',
//                 Cost_Price: 350.00,
//                 Retail_Price: 450.00,
//                 Wholesale_Price: 400.00,
//                 Min_Stock: 20,
//                 Tax_Rate: 0,
//                 Description: 'Premium tea powder'
//             },
//             {
//                 P_Name: 'Flour - Wheat',
//                 P_Name_Sinhala: 'තිරිඟු පිටි',
//                 P_Code: 'FLOUR001',
//                 P_Type: 'Staple',
//                 Base_Unit: 'KG',
//                 Status: 'Active',
//                 Cost_Price: 60.00,
//                 Retail_Price: 80.00,
//                 Wholesale_Price: 70.00,
//                 Min_Stock: 80,
//                 Tax_Rate: 0,
//                 Description: 'Wheat flour for baking'
//             },
//             {
//                 P_Name: 'Salt',
//                 P_Name_Sinhala: 'ලුණු',
//                 P_Code: 'SALT001',
//                 P_Type: 'Staple',
//                 Base_Unit: 'KG',
//                 Status: 'Active',
//                 Cost_Price: 25.00,
//                 Retail_Price: 35.00,
//                 Wholesale_Price: 30.00,
//                 Min_Stock: 100,
//                 Tax_Rate: 0,
//                 Description: 'Table salt'
//             },
//             {
//                 P_Name: 'Dhal - Red',
//                 P_Name_Sinhala: 'පැණි දාල්',
//                 P_Code: 'DHAL001',
//                 P_Type: 'Staple',
//                 Base_Unit: 'KG',
//                 Status: 'Active',
//                 Cost_Price: 120.00,
//                 Retail_Price: 160.00,
//                 Wholesale_Price: 140.00,
//                 Min_Stock: 40,
//                 Tax_Rate: 0,
//                 Description: 'Red lentils'
//             },
//             {
//                 P_Name: 'Spice Mix',
//                 P_Name_Sinhala: 'ස්වාද ගින්න',
//                 P_Code: 'SPICE001',
//                 P_Type: 'Spices',
//                 Base_Unit: 'KG',
//                 Status: 'Active',
//                 Cost_Price: 250.00,
//                 Retail_Price: 350.00,
//                 Wholesale_Price: 300.00,
//                 Min_Stock: 15,
//                 Tax_Rate: 0,
//                 Description: 'Mixed spices blend'
//             }
//         ];

//         console.log('Seeding Products...');
//         for (const product of productsData) {
//             await Product.findOrCreate({
//                 where: { P_Code: product.P_Code },
//                 defaults: product
//             });
//         }
//         console.log('✅ Products seeded successfully.');
//     } catch (error) {
//         console.error('Error seeding products:', error.message);
//     }
// };

// module.exports = seedProducts;
