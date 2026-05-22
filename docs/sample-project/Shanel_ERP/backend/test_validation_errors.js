const axios = require('axios');

const API_URL = 'http://localhost:5000/api/hr/employees';

const testCases = [
    {
        name: 'Missing Full_Name',
        data: {
            Full_Name: '',
            Contact_Phone: '0771234567',
            Hire_Date: '2026-05-08',
            Role: 'Staff',
            Salary_Category: 'Monthly_Fixed'
        }
    },
    {
        name: 'Invalid Email Format',
        data: {
            Full_Name: 'Test Employee',
            Contact_Phone: '0771234567',
            Hire_Date: '2026-05-08',
            Role: 'Staff',
            Salary_Category: 'Monthly_Fixed',
            Email: 'invalid-email-format'
        }
    },
    {
        name: 'Invalid Gender ENUM',
        data: {
            Full_Name: 'Test Employee',
            Contact_Phone: '0771234567',
            Hire_Date: '2026-05-08',
            Role: 'Staff',
            Salary_Category: 'Monthly_Fixed',
            Gender: 'InvalidGender'
        }
    },
    {
        name: 'Invalid Salary_Category ENUM',
        data: {
            Full_Name: 'Test Employee',
            Contact_Phone: '0771234567',
            Hire_Date: '2026-05-08',
            Role: 'Staff',
            Salary_Category: 'InvalidCategory'
        }
    },
    {
        name: 'Invalid Phone Number (too short)',
        data: {
            Full_Name: 'Test Employee',
            Contact_Phone: '123',
            Hire_Date: '2026-05-08',
            Role: 'Staff',
            Salary_Category: 'Monthly_Fixed'
        }
    },
    {
        name: 'Invalid Date Format',
        data: {
            Full_Name: 'Test Employee',
            Contact_Phone: '0771234567',
            Hire_Date: 'invalid-date',
            Role: 'Staff',
            Salary_Category: 'Monthly_Fixed'
        }
    }
];

async function runTests() {
    console.log('🧪 Testing Validation Error Handling\n');
    
    for (const testCase of testCases) {
        console.log(`\n📋 Test: ${testCase.name}`);
        console.log('📤 Sending:', JSON.stringify(testCase.data, null, 2));
        
        try {
            const response = await axios.post(API_URL, testCase.data);
            console.log('❌ Unexpected Success (should have failed):', response.status);
        } catch (error) {
            const status = error.response?.status;
            const data = error.response?.data;
            
            console.log(`✅ Error Status: ${status}`);
            console.log(`📝 Message: ${data?.message}`);
            
            if (data?.validationErrors && Array.isArray(data.validationErrors)) {
                console.log('🔍 Validation Errors:');
                data.validationErrors.forEach(err => {
                    console.log(`   - ${err.path}: ${err.message}`);
                });
            }
        }
    }
}

runTests();
