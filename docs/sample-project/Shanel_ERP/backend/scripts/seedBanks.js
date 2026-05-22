// const Bank = require('../models/Bank/Bank');
// const Branch = require('../models/Bank/Branch');

// const seedBanks = async () => {
//     try {
//         const banksData = [
//             { bank_name: 'Bank of Ceylon', bank_code: '7010' },
//             { bank_name: 'People\'s Bank', bank_code: '7135' },
//             { bank_name: 'Commercial Bank of Ceylon', bank_code: '7048' },
//             { bank_name: 'Hatton National Bank', bank_code: '7083' },
//             { bank_name: 'Sampath Bank', bank_code: '7278' },
//             { bank_name: 'Seylan Bank', bank_code: '7287' },
//             { bank_name: 'Nations Trust Bank', bank_code: '7463' },
//             { bank_name: 'DFCC Bank', bank_code: '7108' },
//             { bank_name: 'NDB Bank', bank_code: '7205' },
//             { bank_name: 'Pan Asia Bank', bank_code: '7302' },
//             { bank_name: 'Union Bank of Colombo', bank_code: '7311' },
//             { bank_name: 'Amana Bank', bank_code: '7472' },
//             { bank_name: 'Cargills Bank', bank_code: '7481' },
//             { bank_name: 'HSBC', bank_code: '7074' },
//             { bank_name: 'Standard Chartered Bank', bank_code: '7057' },
//             { bank_name: 'HNB Assurance', bank_code: '7728' },
//             { bank_name: 'Regional Development Bank', bank_code: '7755' },
//             { bank_name: 'Sarvodaya Development Finance', bank_code: '8004' }
//         ];

//         console.log('Seeding Banks...');
//         for (const bank of banksData) {
//             await Bank.findOrCreate({
//                 where: { bank_name: bank.bank_name },
//                 defaults: bank
//             });
//         }
//         console.log('Banks seeded successfully.');

//         // Adding some major headquarters as initial branches for demonstration
//         const bankRecords = await Bank.findAll();
//         const branchesData = [];
        
//         bankRecords.forEach(bank => {
//             branchesData.push({ bank_id: bank.bank_id, branch_name: 'Head Office', branch_code: '001' });
//         });

//         console.log('Seeding initial branches...');
//         for (const branch of branchesData) {
//             await Branch.findOrCreate({
//                 where: { bank_id: branch.bank_id, branch_name: branch.branch_name },
//                 defaults: branch
//             });
//         }
//         console.log('Branches seeded successfully.');

//     } catch (error) {
//         console.error('Error seeding bank data:', error);
//     }
// };

// module.exports = seedBanks;
