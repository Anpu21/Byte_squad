import PageHeader from '@/components/ui/PageHeader';
import { usePurchasesTab } from '@/features/purchases/hooks/usePurchasesTab';
import { PurchasesTabs } from '@/features/purchases/components/PurchasesTabs';
import { SuppliersPanel } from '@/features/purchases/components/suppliers/SuppliersPanel';
import { GrnsPanel } from '@/features/purchases/components/grns/GrnsPanel';
import { NewGrnPanel } from '@/features/purchases/components/new-grn/NewGrnPanel';

/**
 * Purchases workspace (admin/manager) — the procurement side of stock:
 * goods receipts (GRN register + entry) and the supplier master; purchase
 * orders, bills/payments, and ageing arrive in the following slices.
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
            {tab === 'grns' && <GrnsPanel />}
            {tab === 'new-grn' && (
                <NewGrnPanel onCreated={() => setTab('grns')} />
            )}
            {tab === 'suppliers' && <SuppliersPanel />}
        </div>
    );
}
