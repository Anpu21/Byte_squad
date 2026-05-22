# Sales Management API - Quick Reference & Testing Guide

## BASE URL
```
http://localhost:5000/api/sales-management
```

---

## 📊 DASHBOARD METRICS

### 1. Get Today's Metrics (All metrics in one call)
```
GET /metrics/today
```

**Response**:
```json
{
    "success": true,
    "data": {
        "totalSales": 150000,
        "totalRevenue": 145000,
        "totalDiscount": 5000,
        "totalTax": 12000,
        "totalTransactions": 45
    },
    "message": "Today's metrics fetched successfully"
}
```

---

### 2. Get Period Metrics (Week/Month/Year)
```
GET /metrics/period?period=month
```

**Query Parameters**:
- `period` (required): `week` | `month` | `year`

**Response**:
```json
{
    "success": true,
    "period": "month",
    "data": {
        "totalSales": 2500000,
        "totalRevenue": 2400000,
        "totalDiscount": 100000,
        "totalTax": 250000,
        "totalTransactions": 750,
        "avgSaleValue": 3333.33
    }
}
```

---

### 3. Get Performance Metrics
```
GET /metrics/performance
```

**Response**:
```json
{
    "success": true,
    "data": {
        "totalCustomers": 250,
        "todayActiveCustomers": 45,
        "conversionRate": "18.00%",
        "avgTicketSize": 3333.33,
        "todayTotal": 150000,
        "todayTransactions": 45
    }
}
```

---

## 📋 SALES HISTORY & DETAILS

### 1. Get Sales History (Paginated)
```
GET /history?page=1&limit=20
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20)

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "Sale_Id": 1,
            "Invoice_No": "INV-2026-000001",
            "Sale_Date": "2026-04-24",
            "Sale_Time": "10:30:00",
            "Location": "Shop",
            "Total_Amount": 5000,
            "Payment_Status": "Paid",
            "Customer": {
                "C_ID": 1,
                "C_Name": "John Doe",
                "Phone1": "0712345678",
                "Email": "john@email.com"
            }
        }
    ],
    "pagination": {
        "total": 150,
        "page": 1,
        "pages": 8,
        "limit": 20
    }
}
```

---

### 2. Get Sale Details by ID
```
GET /:saleId
```

**Example**:
```
GET /123
```

**Response**:
```json
{
    "success": true,
    "data": {
        "Sale_Id": 123,
        "Invoice_No": "INV-2026-000123",
        "Sale_Date": "2026-04-24",
        "Total_Amount": 8500,
        "Payment_Status": "Paid",
        "Customer": {
            "C_ID": 5,
            "C_Name": "ABC Company",
            "Phone1": "0712345678",
            "Email": "abc@company.com",
            "Credit_Limit": 50000,
            "Current_Balance": 10000
        },
        "SaleItems": [
            {
                "Sale_Item_Id": 1,
                "P_ID": 10,
                "Quantity": 5,
                "Unit_Price": 1500,
                "Line_Total": 7500
            }
        ],
        "Payments": [
            {
                "Pay_ID": 1,
                "Payment_Method": "Cash",
                "Payment_Amount": 8500,
                "Payment_Date": "2026-04-24"
            }
        ]
    }
}
```

---

### 3. Get Sale Items by Sale ID
```
GET /:saleId/items
```

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "Sale_Item_Id": 1,
            "P_ID": 10,
            "P_Name": "Product Name",
            "Quantity": 5,
            "Unit_Price": 1500,
            "Line_Total": 7500,
            "Product": {
                "P_ID": 10,
                "P_Name": "Product Name",
                "Base_Unit": "Packet"
            }
        }
    ],
    "count": 1
}
```

---

## 🔍 SEARCH & FILTERING

### 1. Advanced Search
```
GET /search?query=INV-2026&paymentStatus=Paid&startDate=2026-04-01&endDate=2026-04-30&location=Shop
```

**Query Parameters**:
- `query`: Search by invoice number
- `paymentStatus`: `Paid` | `Unpaid` | `Partially_Paid`
- `startDate`: ISO date format (YYYY-MM-DD)
- `endDate`: ISO date format (YYYY-MM-DD)
- `location`: `Shop` | `Production` | `Main_Warehouse`

**Response**: Array of matching sales

---

### 2. Filter by Date Range
```
GET /filter/date-range?startDate=2026-04-01&endDate=2026-04-30&page=1&limit=20
```

**Query Parameters**:
- `startDate` (required): YYYY-MM-DD
- `endDate` (required): YYYY-MM-DD
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20)

---

### 3. Filter by Payment Status
```
GET /filter/payment-status?paymentStatus=Unpaid&page=1&limit=20
```

**Query Parameters**:
- `paymentStatus` (required): `Paid` | `Unpaid` | `Partially_Paid`

---

### 4. Filter by Location
```
GET /filter/location?location=Shop&page=1&limit=20
```

**Query Parameters**:
- `location` (required): `Shop` | `Production` | `Main_Warehouse`

---

### 5. Get Due/Pending Sales
```
GET /filter/due-sales?page=1&limit=20
```

**Response**: Sales with Balance_Due > 0, sorted by due date

---

## 📈 ANALYTICS

### 1. Top Selling Products
```
GET /analytics/top-products?period=month&limit=10
```

**Query Parameters**:
- `period`: `week` | `month` | `year` (default: month)
- `limit`: Number of products (default: 10)

**Response**:
```json
{
    "success": true,
    "period": "month",
    "data": [
        {
            "P_ID": 10,
            "totalQuantity": 450,
            "totalRevenue": 675000,
            "salesCount": 45,
            "Product": {
                "P_ID": 10,
                "P_Name": "Bestseller Product",
                "Retail_Price": 1500
            }
        }
    ]
}
```

---

### 2. Customer Sales Summary
```
GET /analytics/customer-summary?page=1&limit=20
```

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "C_ID": 1,
            "C_Name": "Top Customer",
            "totalTransactions": 25,
            "totalSpent": 125000,
            "totalPaid": 120000,
            "totalDue": 5000,
            "lastSaleDate": "2026-04-24"
        }
    ],
    "pagination": {
        "total": 150,
        "page": 1,
        "pages": 8
    }
}
```

---

### 3. Payment Method Breakdown
```
GET /analytics/payment-method?startDate=2026-04-01&endDate=2026-04-30
```

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "Payment_Method": "Cash",
            "count": 120,
            "total": 500000
        },
        {
            "Payment_Method": "Bank_Deposit",
            "count": 45,
            "total": 250000
        },
        {
            "Payment_Method": "Card",
            "count": 30,
            "total": 180000
        }
    ]
}
```

---

### 4. Sales by Type (Retail vs Wholesale)
```
GET /analytics/by-type
```

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "Sale_Type": "Retail",
            "count": 450,
            "total": 1350000,
            "average": 3000
        },
        {
            "Sale_Type": "Wholesale",
            "count": 75,
            "total": 850000,
            "average": 11333.33
        }
    ]
}
```

---

## 📑 REPORTS

### 1. Monthly Sales Report
```
GET /reports/monthly?month=4&year=2026
```

**Query Parameters**:
- `month` (required): 1-12
- `year` (required): Year

**Response**:
```json
{
    "success": true,
    "period": "4/2026",
    "data": [
        {
            "Sale_Date": "2026-04-01",
            "count": 15,
            "total": 45000,
            "received": 43000,
            "due": 2000
        },
        {
            "Sale_Date": "2026-04-02",
            "count": 18,
            "total": 52000,
            "received": 50000,
            "due": 2000
        }
    ]
}
```

---

## 🧪 CURL EXAMPLES FOR TESTING

```bash
# Today's metrics
curl "http://localhost:5000/api/sales-management/metrics/today"

# Month metrics
curl "http://localhost:5000/api/sales-management/metrics/period?period=month"

# Sales history
curl "http://localhost:5000/api/sales-management/history?page=1&limit=10"

# Search sales
curl "http://localhost:5000/api/sales-management/search?query=INV-2026&paymentStatus=Paid"

# Top products
curl "http://localhost:5000/api/sales-management/analytics/top-products?period=month&limit=10"

# Monthly report
curl "http://localhost:5000/api/sales-management/reports/monthly?month=4&year=2026"

# Due sales
curl "http://localhost:5000/api/sales-management/filter/due-sales?page=1&limit=20"

# Payment breakdown
curl "http://localhost:5000/api/sales-management/analytics/payment-method"

# Customer summary
curl "http://localhost:5000/api/sales-management/analytics/customer-summary?page=1&limit=10"

# Sales by type
curl "http://localhost:5000/api/sales-management/analytics/by-type"
```

---

## 🧪 POSTMAN SETUP

### Import Collection
Create a Postman collection with these folders:
```
Sales Management
├── Dashboard
│   ├── Today's Metrics
│   ├── Period Metrics
│   └── Performance Metrics
├── History
│   ├── Sales History
│   ├── Sale Details
│   └── Sale Items
├── Search & Filter
│   ├── Advanced Search
│   ├── Date Range Filter
│   ├── Payment Status Filter
│   ├── Location Filter
│   └── Due Sales
├── Analytics
│   ├── Top Products
│   ├── Customer Summary
│   ├── Payment Methods
│   └── Sales by Type
└── Reports
    └── Monthly Report
```

---

## ✅ VALIDATION EXAMPLES

### Invalid Payment Status
```
GET /filter/payment-status?paymentStatus=INVALID

Response: 400 Bad Request
{
    "success": false,
    "message": "Invalid payment status. Valid options: Paid, Unpaid, Partially_Paid"
}
```

### Invalid Sale ID
```
GET /123abc

Response: 400 Bad Request
{
    "success": false,
    "message": "Invalid sale ID"
}
```

### Missing Date Range
```
GET /filter/date-range

Response: 400 Bad Request
{
    "success": false,
    "message": "startDate and endDate are required"
}
```

---

## 📊 COMMON USE CASES

### 1. Dashboard View
```javascript
// Fetch 3 API calls in parallel
Promise.all([
    fetch('/metrics/today'),
    fetch('/analytics/top-products?limit=5'),
    fetch('/filter/due-sales?limit=10')
]);
```

### 2. Sales Report for Manager
```
fetch('/reports/monthly?month=4&year=2026')
```

### 3. Find Unpaid Invoices
```
fetch('/filter/payment-status?paymentStatus=Unpaid')
```

### 4. Revenue Analysis
```
fetch('/metrics/period?period=month')
```

### 5. Customer Analysis
```
fetch('/analytics/customer-summary?limit=20')
```

---

## 📝 RESPONSE TIME EXPECTATIONS

| Endpoint | Records | Expected Time |
|----------|---------|----------------|
| /metrics/today | - | < 100ms |
| /history | 20 | 150-200ms |
| /analytics/top-products | 10 | 200-300ms |
| /analytics/customer-summary | 100 | 300-500ms |
| /reports/monthly | 30 days | 400-600ms |

---

## 🔐 SECURITY NOTES

1. **Add JWT Authentication**: All endpoints should require valid token
2. **Rate Limiting**: Implement rate limiting (e.g., 100 requests/min)
3. **Input Sanitization**: All string inputs are already validated
4. **CORS**: Configure CORS if frontend on different domain
5. **Logging**: Log all endpoint access for audit trail

---

## 📞 SUPPORT

For issues or questions:
1. Check response `error` field for details
2. Review backend console logs
3. Verify all required query parameters are provided
4. Ensure date format is YYYY-MM-DD
5. Check database connection

