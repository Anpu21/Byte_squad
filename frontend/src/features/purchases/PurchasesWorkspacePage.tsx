import { useState } from 'react';
import { WorkspacePage } from '@/components/ui';
import { useNavTabs } from '@/config/navigation';
import type { IPurchaseOrder } from '@/types';
import {
    usePurchasesTab,
    type PurchasesTab,
} from '@/features/purchases/hooks/usePurchasesTab';
import { SuppliersPanel } from '@/features/purchases/components/suppliers/SuppliersPanel';
import { GrnsPanel } from '@/features/purchases/components/grns/GrnsPanel';
import { NewGrnPanel } from '@/features/purchases/components/new-grn/NewGrnPanel';
import { OrdersPanel } from '@/features/purchases/components/orders/OrdersPanel';
import { ReorderPanel } from '@/features/purchases/components/reorder/ReorderPanel';
import { BillsPanel } from '@/features/purchases/components/bills/BillsPanel';
import { AgeingPanel } from '@/features/purchases/components/ageing/AgeingPanel';

/**
 * Purchases workspace (admin/manager) — the BUSY-style procurement cycle:
 * GRN register + entry, purchase orders (receivable into a GRN),
 * bill-by-bill payments, payables ageing, and the supplier master. Tabs come
 * from the central navigation config.
 */
export function PurchasesWorkspacePage() {
    const { tab, setTab } = usePurchasesTab();
    const tabs = useNavTabs<PurchasesTab>('purchases');
    const [orderToReceive, setOrderToReceive] =
        useState<IPurchaseOrder | null>(null);

    return (
        <WorkspacePage
            eyebrow="Inventory"
            title="Purchases"
            subtitle="Suppliers and goods receipts — where stock and cost enter the system."
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Purchases workspace views"
            chromeless
        >
            {tab === 'grns' && <GrnsPanel />}
            {tab === 'new-grn' && (
                <NewGrnPanel
                    key={orderToReceive?.id ?? 'blank'}
                    prefillOrder={orderToReceive}
                    onCreated={() => {
                        setOrderToReceive(null);
                        setTab('grns');
                    }}
                />
            )}
            {tab === 'orders' && (
                <OrdersPanel
                    onReceive={(order) => {
                        setOrderToReceive(order);
                        setTab('new-grn');
                    }}
                />
            )}
            {tab === 'reorder' && (
                <ReorderPanel onDrafted={() => setTab('orders')} />
            )}
            {tab === 'bills' && <BillsPanel />}
            {tab === 'ageing' && <AgeingPanel />}
            {tab === 'suppliers' && <SuppliersPanel />}
        </WorkspacePage>
    );
}
