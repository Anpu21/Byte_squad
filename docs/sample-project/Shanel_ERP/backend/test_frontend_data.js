const axios = require('axios');

// Test with same data as frontend form (empty NIC to see what happens)
const testData = {
  Full_Name: "Test Employee From Frontend",
  Name_With_Initials: "T.E.F",
  NIC: "",  // Empty like frontend default
  Date_Of_Birth: "",
  Gender: "",
  Marital_Status: "",
  Contact_Phone: "0771234567",
  Contact_Phone_2: "",
  Email: "test@example.com",
  City: "",
  Department: "HR",
  Role: "Staff",
  Salary_Category: "Monthly_Fixed",
  Employee_Type: "Permanent",
  Hire_Date: "2026-05-08",  // Added required date
  Confirmation_Date: "",
  Status: "Active",
  EPF_Eligible: "Yes",
  ETF_Eligible: "Yes",
  EPF_Number: "",
  Bank_Name: "",
  Bank_Account_No: "",
  Bank_Branch: "",
  Bank_Account_Name: "",
  Permanent_Address: "",
  Current_Address: "",
  Emergency_Contact_Name: "",
  Emergency_Contact_Phone: "",
  Emergency_Contact_Relationship: "",
  Notes: "",
  image: ""
};

console.log('📤 Testing with actual frontend form data (empty fields)');
console.log('Payload:', JSON.stringify(testData, null, 2));

(async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/hr/employees', testData);
    console.log('\n✅ Success:', response.status);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ Error Status:', error.response?.status);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
  }
})();
