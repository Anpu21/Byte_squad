import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import type { IPurchaseOrder } from '@/types';
import { usePurchasesTab } from '@/features/purchases/hooks/usePurchasesTab';
import { PurchasesTabs } from '@/features/purchases/components/PurchasesTabs';
import { SuppliersPanel } from '@/features/purchases/components/suppliers/SuppliersPanel';
import { GrnsPanel } from '@/features/purchases/components/grns/GrnsPanel';
import { NewGrnPanel } from '@/features/purchases/components/new-grn/NewGrnPanel';
import { OrdersPanel } from '@/features/purchases/components/orders/OrdersPanel';
import { BillsPanel } from '@/features/purchases/components/bills/BillsPanel';
import { AgeingPanel } from '@/features/purchases/components/ageing/AgeingPanel';

/**
 * Purchases workspace (admin/manager) — the BUSY-style procurement cycle:
 * GRN register + entry, purchase orders (receivable into a GRN),
 * bill-by-bill payments, payables ageing, and the supplier master.
 */
export function PurchasesWorkspacePage() {
    const { tab, setTab } = usePurchasesTab();
    const [orderToReceive, setOrderToReceive] =
        useState<IPurchaseOrder | null>(null);

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
            {tab === 'bills' && <BillsPanel />}
            {tab === 'ageing' && <AgeingPanel />}
            {tab === 'suppliers' && <SuppliersPanel />}
        </div>
    );
}
