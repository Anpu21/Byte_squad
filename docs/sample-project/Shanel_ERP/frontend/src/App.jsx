import SlideBar from './component/SlideBar/SlideBar.jsx'
import { Routes, Route, Navigate } from 'react-router-dom'
import Inventory_Dashboard from './pages/Inventory/InventoryDashboard';
import Hrdashboardpage from './pages/HR/Hrdashboardpage';
import EmployeesPage from './pages/HR/EmployeesPage';
import Attendance from './pages/HR/AttendancePage.jsx';
import Payroll from './pages/HR/Payroll.jsx';
import Leave from './pages/HR/Leave.jsx';
import Reports from './pages/HR/Reports.jsx';
import Header from './component/Header/Header';
import ProductPage from './pages/Inventory/ProductPage.jsx';
import ProductionStock from './pages/Inventory/ProductionStock.jsx';
import SalesStock from './pages/Inventory/SalesStock.jsx';
import StockTransfer from './pages/Inventory/StockTransfer.jsx';
import StockAdjustment from './pages/Inventory/StockAdjustment.jsx';
import ReturnsManagement from './pages/Inventory/ReturnsManagement.jsx';
import CurrentStockReport from './pages/Inventory/Reports/CurrentStockReport.jsx';
import InventoryReports from './pages/Inventory/Reports/InventoryReports.jsx';
import ExpiryReport from './pages/Inventory/Reports/ExpiryReport.jsx';
import ProductionReport from './pages/Inventory/Reports/ProductionReport.jsx';
import PurchaseReport from './pages/Inventory/Reports/PurchaseReport.jsx';
import SupplierPurchaseReport from './pages/Inventory/Reports/SupplierPurchaseReport.jsx';
import TransferReport from './pages/Inventory/Reports/TransferReport.jsx';
import AlertsPage from './pages/Inventory/AlertsPage.jsx';
import POS from './pages/POS/POS.jsx';
import PaymentManagementPage from './pages/Finance/PaymentManagementPage.jsx';
import ReceivePaymentPage from './pages/Finance/ReceivePaymentPage.jsx';
import MakePaymentPage from './pages/Finance/MakePaymentPage.jsx';
import GeneralLedgerPage from './pages/Finance/GeneralLedgerPage.jsx';
import ChartOfAccountsPage from './pages/Finance/ChartOfAccountsPage.jsx';
import AccountLedgerPage from './pages/Finance/AccountLedgerPage.jsx';
import CreateAccountPage from './pages/Finance/CreateAccountPage.jsx';
import EditTransactionsPage from './pages/Finance/EditTransactionsPage.jsx';
import ReportsPage from './pages/Finance/ReportsPage.jsx';
import LoginForm from './pages/User/LoginForm.jsx';
import UserDashboard from './pages/User/userDashboard.jsx';
import Logout from './pages/User/Logout.jsx';
import SalesDashboard from './pages/Sales/SalesDashboard.jsx';
import SalesHistory from './pages/Sales/SalesHistory.jsx';
import DueSales from './pages/Sales/DueSales.jsx';
import SalesReport from './pages/Sales/SalesReport.jsx';
import SalesPerformancePage from './pages/Sales/SalesPerformancePage.jsx';
import CompanyItemsReportPage from './pages/Sales/CompanyItemsReportPage.jsx';
import OtherItemsReportPage from './pages/Sales/OtherItemsReportPage.jsx';
import LocationWiseReportPage from './pages/Sales/LocationWiseReportPage.jsx';
import PaymentCollectionPage from './pages/Sales/PaymentCollectionPage.jsx';
import AdminHome from './pages/Home/AdminHome.jsx';
import ManagerHome from './pages/Home/ManagerHome.jsx';
import CashierHome from './pages/Home/CashierHome.jsx';
import ProtectedRoute from './component/Auth/ProtectedRoute.jsx';
import { getUserType, isAuthenticated as checkAuth } from './utils/auth.js';
import './App.css';

// Renders the correct home dashboard based on the logged-in user's role
const HomeDispatcher = () => {
  const type = getUserType();
  if (type === 'Admin')   return <AdminHome />;
  if (type === 'Manager') return <ManagerHome />;
  if (type === 'Cashier') return <CashierHome />;
  return <Navigate to="/login" replace />;
};

const App = () => {
  const isAuthenticated = checkAuth();

  return (
    <div className="d-flex w-100" style={{ height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      {isAuthenticated && <SlideBar />}

      <div className="flex-grow-1 d-flex flex-column main-content-wrapper" style={{ height: '100vh', overflow: 'hidden' }}>
        {isAuthenticated && <Header />}

        <main className='p-4 flex-grow-1' style={{ overflowY: 'auto' }}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />

            {/* Role-Based Home */}
            <Route path="/home" element={
              <ProtectedRoute>
                <HomeDispatcher />
              </ProtectedRoute>
            } />

            {/* Inventory — Admin & Manager */}
            <Route path="/inventory"                          element={<ProtectedRoute allowedRoles={['Admin','Manager']}><Inventory_Dashboard /></ProtectedRoute>} />
            <Route path="/inventory/company-items"            element={<ProtectedRoute allowedRoles={['Admin','Manager']}><ProductPage pageTitle="Company Items" typeFilter="Company" /></ProtectedRoute>} />
            <Route path="/inventory/other-items"              element={<ProtectedRoute allowedRoles={['Admin','Manager']}><ProductPage pageTitle="Other Items" typeFilter="Other" /></ProtectedRoute>} />
            <Route path="/inventory/raw-materials"            element={<ProtectedRoute allowedRoles={['Admin','Manager']}><ProductPage pageTitle="Raw Materials" typeFilter="Raw" /></ProtectedRoute>} />
            <Route path="/inventory/production-stock"         element={<ProtectedRoute allowedRoles={['Admin','Manager']}><ProductionStock /></ProtectedRoute>} />
            <Route path="/inventory/salesStock"               element={<ProtectedRoute allowedRoles={['Admin','Manager']}><SalesStock /></ProtectedRoute>} />
            <Route path="/inventory/stock-transfers"          element={<ProtectedRoute allowedRoles={['Admin','Manager']}><StockTransfer /></ProtectedRoute>} />
            <Route path="/inventory/stock-adjustments"        element={<ProtectedRoute allowedRoles={['Admin','Manager']}><StockAdjustment /></ProtectedRoute>} />
            <Route path="/inventory/returns"                  element={<ProtectedRoute allowedRoles={['Admin','Manager']}><ReturnsManagement /></ProtectedRoute>} />
            <Route path="/inventory/alerts"                   element={<ProtectedRoute allowedRoles={['Admin','Manager']}><AlertsPage /></ProtectedRoute>} />
            <Route path="/inventory/reports"                  element={<ProtectedRoute allowedRoles={['Admin','Manager']}><InventoryReports /></ProtectedRoute>} />
            <Route path="/inventory/reports/current-stock"    element={<ProtectedRoute allowedRoles={['Admin','Manager']}><CurrentStockReport /></ProtectedRoute>} />
            <Route path="/inventory/reports/expiry"           element={<ProtectedRoute allowedRoles={['Admin','Manager']}><ExpiryReport /></ProtectedRoute>} />
            <Route path="/inventory/reports/daily-production" element={<ProtectedRoute allowedRoles={['Admin','Manager']}><ProductionReport /></ProtectedRoute>} />
            <Route path="/inventory/reports/purchases"        element={<ProtectedRoute allowedRoles={['Admin','Manager']}><PurchaseReport /></ProtectedRoute>} />
            <Route path="/inventory/reports/supplier-purchases" element={<ProtectedRoute allowedRoles={['Admin','Manager']}><SupplierPurchaseReport /></ProtectedRoute>} />
            <Route path="/inventory/reports/transfers"        element={<ProtectedRoute allowedRoles={['Admin','Manager']}><TransferReport /></ProtectedRoute>} />

            {/* HR — Admin & Manager */}
            <Route path="/hr"              element={<ProtectedRoute allowedRoles={['Admin','Manager']}><Hrdashboardpage /></ProtectedRoute>} />
            <Route path="/hr/employees"    element={<ProtectedRoute allowedRoles={['Admin','Manager']}><EmployeesPage /></ProtectedRoute>} />
            <Route path="/hr/attendance"   element={<ProtectedRoute allowedRoles={['Admin','Manager']}><Attendance /></ProtectedRoute>} />
            <Route path="/hr/payroll"      element={<ProtectedRoute allowedRoles={['Admin','Manager']}><Payroll /></ProtectedRoute>} />
            <Route path="/hr/leave"        element={<ProtectedRoute allowedRoles={['Admin','Manager']}><Leave /></ProtectedRoute>} />
            <Route path="/hr/reports"      element={<ProtectedRoute allowedRoles={['Admin','Manager']}><Reports /></ProtectedRoute>} />

            {/* POS — All authenticated roles */}
            <Route path="/POS" element={<ProtectedRoute><POS /></ProtectedRoute>} />

            {/* Finance — Admin only */}
            <Route path="/finance"                    element={<ProtectedRoute allowedRoles={['Admin']}><PaymentManagementPage /></ProtectedRoute>} />
            <Route path="/finance/receive-payment"    element={<ProtectedRoute allowedRoles={['Admin']}><ReceivePaymentPage /></ProtectedRoute>} />
            <Route path="/finance/make-payment"       element={<ProtectedRoute allowedRoles={['Admin']}><MakePaymentPage /></ProtectedRoute>} />
            <Route path="/finance/general-ledger"     element={<ProtectedRoute allowedRoles={['Admin']}><GeneralLedgerPage /></ProtectedRoute>} />
            <Route path="/finance/chart-of-accounts"  element={<ProtectedRoute allowedRoles={['Admin']}><ChartOfAccountsPage /></ProtectedRoute>} />
            <Route path="/finance/ledger/:accountCode" element={<ProtectedRoute allowedRoles={['Admin']}><AccountLedgerPage /></ProtectedRoute>} />
            <Route path="/finance/create-account"     element={<ProtectedRoute allowedRoles={['Admin']}><CreateAccountPage /></ProtectedRoute>} />
            <Route path="/finance/reports"            element={<ProtectedRoute allowedRoles={['Admin']}><ReportsPage /></ProtectedRoute>} />
            <Route path="/finance/edit-transactions"  element={<ProtectedRoute allowedRoles={['Admin']}><EditTransactionsPage /></ProtectedRoute>} />

            {/* User Management — Admin only */}
            <Route path="/user-management" element={<ProtectedRoute allowedRoles={['Admin']}><UserDashboard /></ProtectedRoute>} />

            <Route path="/hr/employees" element={<EmployeesPage />} />
            <Route path="/hr/attendance" element={<Attendance />} />
            <Route path="/hr/payroll" element={<Payroll />} />
            <Route path="/hr/leave" element={<Leave />} />
            <Route path="/hr/reports" element={<Reports />} />
            <Route path="/POS" element={<POS />} />
            <Route path="/hr" element={<Hrdashboardpage />} />
            
            <Route path="/finance" element={<PaymentManagementPage />} />
            <Route path="/finance/receive-payment" element={<ReceivePaymentPage />} />
            <Route path="/finance/make-payment" element={<MakePaymentPage />} />
            <Route path="/finance/general-ledger" element={<GeneralLedgerPage />} />
            <Route path="/finance/chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="/finance/ledger/:accountCode" element={<AccountLedgerPage />} />
            <Route path="/finance/create-account" element={<CreateAccountPage />} />
            <Route path="/finance/reports" element={<ReportsPage />} />
            <Route path="/finance/edit-transactions" element={<EditTransactionsPage />} />
            
            <Route path="/sales" element={<SalesDashboard />} />
            <Route path="/sales/history" element={<SalesHistory />} />
            <Route path="/sales/due" element={<DueSales />} />
            <Route path="/sales/reports" element={<SalesReport />} />
            <Route path="/sales/performance" element={<SalesPerformancePage />} />
            <Route path="/sales/collection" element={<PaymentCollectionPage />} />
            <Route path="/sales/reports/company" element={<CompanyItemsReportPage />} />
            <Route path="/sales/reports/other" element={<OtherItemsReportPage />} />
            <Route path="/sales/reports/location" element={<LocationWiseReportPage />} />
            
            <Route path="/user-management" element={<UserDashboard />} />
            
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/login'} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;