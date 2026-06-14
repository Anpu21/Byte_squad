import { useState } from 'react';
import {
    Building2,
    CalendarClock,
    ClipboardList,
    FileText,
    PackagePlus,
    Wallet,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import type { IPurchaseOrder } from '@/types';
import {
    usePurchasesTab,
    type PurchasesTab,
} from '@/features/purchases/hooks/usePurchasesTab';
import { SuppliersPanel } from '@/features/purchases/components/suppliers/SuppliersPanel';
import { GrnsPanel } from '@/features/purchases/components/grns/GrnsPanel';
import { NewGrnPanel } from '@/features/purchases/components/new-grn/NewGrnPanel';
import { OrdersPanel } from '@/features/purchases/components/orders/OrdersPanel';
import { BillsPanel } from '@/features/purchases/components/bills/BillsPanel';
import { AgeingPanel } from '@/features/purchases/components/ageing/AgeingPanel';

const TABS: TabItem<PurchasesTab>[] = [
    { key: 'grns', label: 'Goods receipts', Icon: ClipboardList },
    { key: 'new-grn', label: 'New GRN', Icon: PackagePlus },
    { key: 'orders', label: 'Purchase orders', Icon: FileText },
    { key: 'bills', label: 'Bills & Payments', Icon: Wallet },
    { key: 'ageing', label: 'Ageing', Icon: CalendarClock },
    { key: 'suppliers', label: 'Suppliers', Icon: Building2 },
];

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
            <Tabs
                tabs={TABS}
                active={tab}
                onChange={setTab}
                ariaLabel="Purchases workspace views"
            />
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
