// const sequelize = require('../config/db');
// const Product = require('../models/inventory/Product');

// const updateSinhalaNamesScript = async () => {
//     try {
//         await sequelize.authenticate();
//         console.log('✅ Database connected');

//         // List of products to update with Sinhala names
//         const updates = [
//             { P_ID: 14, P_Name_Sinhala: 'බෝතල' }, // Bottle
//             { P_ID: 15, P_Name_Sinhala: 'පරිමාණ' }, // Measure
//             { P_ID: 16, P_Name_Sinhala: 'පෙට්ටිය' }, // Box
//             // Add more as needed
//         ];

//         for (const update of updates) {
//             const result = await Product.update(
//                 { P_Name_Sinhala: update.P_Name_Sinhala },
//                 { where: { P_ID: update.P_ID } }
//             );
//             console.log(`✅ Updated Product ID ${update.P_ID} with Sinhala: ${update.P_Name_Sinhala} (Rows affected: ${result[0]})`);
//         }

//         console.log('✅ All Sinhala names updated successfully!');
//         process.exit(0);
//     } catch (error) {
//         console.error('❌ Error:', error.message);
//         process.exit(1);
//     }
// };

// updateSinhalaNamesScript();
