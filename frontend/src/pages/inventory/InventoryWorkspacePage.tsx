import {
    Barcode,
    Boxes,
    CalendarClock,
    ClipboardList,
    Tags,
    Truck,
    Undo2,
} from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import {
    useInventoryTab,
    type InventoryTab,
} from '@/features/admin-inventory/hooks/useInventoryTab';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { InventoryByRole } from '@/routes/InventoryByRole';
import { ExpiryReportPage } from '@/pages/inventory/ExpiryReportPage';
import { StockAdjustmentsPage } from '@/pages/inventory/StockAdjustmentsPage';
import { ReturnsPage } from '@/pages/inventory/ReturnsPage';
import { AdminTransfersPage } from '@/features/admin-transfer-board';
import { TransferRequestsPage } from '@/features/transfer-requests';
import { CategoriesPanel } from '@/features/categories/components/CategoriesPanel';
import { LabelPrintPanel } from '@/features/labels/components/LabelPrintPanel';

const TABS: TabItem<InventoryTab>[] = [
    { key: 'list', label: 'Inventory', Icon: Boxes },
    { key: 'expiry', label: 'Expiry', Icon: CalendarClock },
    { key: 'adjustments', label: 'Adjustments', Icon: ClipboardList },
    { key: 'returns', label: 'Returns', Icon: Undo2 },
    { key: 'transfers', label: 'Transfers', Icon: Truck },
    { key: 'categories', label: 'Categories', Icon: Tags },
    { key: 'labels', label: 'Labels', Icon: Barcode },
];

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
            <Tabs
                tabs={TABS}
                active={tab}
                onChange={setTab}
                ariaLabel="Inventory workspace views"
            />
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
