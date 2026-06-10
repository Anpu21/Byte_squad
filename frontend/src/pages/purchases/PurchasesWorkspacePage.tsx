import PageHeader from '@/components/ui/PageHeader';
import { usePurchasesTab } from '@/features/purchases/hooks/usePurchasesTab';
import { PurchasesTabs } from '@/features/purchases/components/PurchasesTabs';
import { SuppliersPanel } from '@/features/purchases/components/suppliers/SuppliersPanel';

/**
 * Purchases workspace (admin/manager) — the procurement side of stock:
 * supplier master now; GRNs, purchase orders, bills/payments, and ageing
 * arrive in the following slices.
 */
export function PurchasesWorkspacePage() {
    const { tab, setTab } = usePurchasesTab();

    return (
        <div>
            <PageHeader
                eyebrow="Inventory"
                title="Purchases"
                subtitle="Suppliers and goods receipts — where stock and cost enter the system."
            />
            <PurchasesTabs active={tab} onChange={setTab} />
            {tab === 'suppliers' && <SuppliersPanel />}
        </div>
    );
}
