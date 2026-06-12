import { InventoryTabs } from '@/features/admin-inventory/components/InventoryTabs';
import { useInventoryTab } from '@/features/admin-inventory/hooks/useInventoryTab';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { InventoryByRole } from '@/routes/InventoryByRole';
import { ExpiryReportPage } from '@/pages/inventory/ExpiryReportPage';
import { StockAdjustmentsPage } from '@/pages/inventory/StockAdjustmentsPage';
import { ReturnsPage } from '@/pages/inventory/ReturnsPage';
import { AdminTransfersPage } from '@/pages/transfers/AdminTransfersPage';
import { TransferRequestsPage } from '@/pages/transfers/TransferRequestsPage';
import { CategoriesPanel } from '@/features/categories/components/CategoriesPanel';
import { LabelPrintPanel } from '@/features/labels/components/LabelPrintPanel';

/**
 * Unified Inventory workspace (mirrors the HR admin page): one route with a tab
 * strip switching between the inventory views. Each tab body is the existing
 * page (which carries its own header + entrance animation), so no extra wrapper
 * here. List and Transfers branch by role exactly as their standalone routes do
 * (Admin board/history vs Manager request flow).
 */
export function InventoryWorkspacePage() {
    const { tab, setTab } = useInventoryTab();
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    return (
        <div>
            <InventoryTabs active={tab} onChange={setTab} />
            {tab === 'list' && <InventoryByRole />}
            {tab === 'expiry' && <ExpiryReportPage />}
            {tab === 'adjustments' && <StockAdjustmentsPage />}
            {tab === 'returns' && <ReturnsPage />}
            {tab === 'transfers' &&
                (isAdmin ? <AdminTransfersPage /> : <TransferRequestsPage />)}
            {tab === 'categories' && <CategoriesPanel />}
            {tab === 'labels' && <LabelPrintPanel />}
        </div>
    );
}
