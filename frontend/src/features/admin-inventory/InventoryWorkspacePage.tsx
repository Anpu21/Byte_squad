import { WorkspacePage } from '@/components/ui';
import { useNavTabs } from '@/config/navigation';
import {
    useInventoryTab,
    type InventoryTab,
} from '@/features/admin-inventory/hooks/useInventoryTab';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { InventoryByRole } from '@/routes/routeEntries';
import { ExpiryReportPage } from '@/features/inventory-expiry';
import { StockAdjustmentsPage } from '@/features/stock-adjustments';
import { ReturnsPage } from '@/features/returns';
import { AdminTransfersPage } from '@/features/admin-transfer-board';
import { TransferRequestsPage } from '@/features/transfer-requests';
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
    const tabs = useNavTabs<InventoryTab>('inventory');

    return (
        <WorkspacePage
            eyebrow="Operations"
            title="Inventory"
            subtitle="Stock on hand, expiry, adjustments, returns, transfers, categories, and labels."
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Inventory workspace views"
        >
            {tab === 'list' && <InventoryByRole />}
            {tab === 'expiry' && <ExpiryReportPage />}
            {tab === 'adjustments' && <StockAdjustmentsPage />}
            {tab === 'returns' && <ReturnsPage />}
            {tab === 'transfers' &&
                (isAdmin ? (
                    <AdminTransfersPage embedded />
                ) : (
                    <TransferRequestsPage embedded />
                ))}
            {tab === 'categories' && <CategoriesPanel />}
            {tab === 'labels' && <LabelPrintPanel />}
        </WorkspacePage>
    );
}
