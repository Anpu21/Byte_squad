const axios = require('axios');

// This matches the frontend's defaultAddForm
const uniqueId = Date.now();
const testData = {
  Full_Name: `Frontend Test Employee ${uniqueId}`,
  Name_With_Initials: "F.T.E",
  NIC: `19990${String(uniqueId).slice(-7)}`,  // Generate unique NIC
  Date_Of_Birth: "1999-01-15",
  Gender: "Male",
  Marital_Status: "Single",
  Contact_Phone: "0771234567",
  Contact_Phone_2: "",
  Email: "test@example.com",
  City: "Colombo",
  Department: "HR",  // This is what frontend sends but backend model doesn't have
  Role: "Staff",
  Salary_Category: "Monthly_Fixed",
  Employee_Type: "Permanent",
  Hire_Date: "2026-05-08",
  Confirmation_Date: "",
  Status: "Active",
  EPF_Eligible: "Yes",
  ETF_Eligible: "Yes",
  EPF_Number: "",
  Bank_Name: "",
  Bank_Account_No: "",
  Bank_Branch: "",
  Bank_Account_Name: "",
  Permanent_Address: "123 Main St",
  Current_Address: "123 Main St",
  Emergency_Contact_Name: "John Doe",
  Emergency_Contact_Phone: "0771111111",
  Emergency_Contact_Relationship: "Father",
  Notes: "",
  image: ""  // This shouldn't go to DB
};

(async () => {
  try {
    console.log('📤 Sending frontend-like payload with', Object.keys(testData).length, 'fields');
    const response = await axios.post('http://localhost:5000/api/hr/employees', testData);
    console.log('✅ Success:', response.status);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full Error:', error.response?.data?.error);
    console.error('Full Response:', JSON.stringify(error.response?.data, null, 2));
  }
})();
