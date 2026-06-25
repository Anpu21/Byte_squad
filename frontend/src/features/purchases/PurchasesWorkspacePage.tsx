import { useState } from 'react';
import { LuBuilding2 as Building2, LuCalendarClock as CalendarClock, LuClipboardList as ClipboardList, LuFileText as FileText, LuPackagePlus as PackagePlus, LuWallet as Wallet } from 'react-icons/lu';
import { WorkspacePage, type TabItem } from '@/components/ui';
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
        <WorkspacePage
            eyebrow="Inventory"
            title="Purchases"
            subtitle="Suppliers and goods receipts — where stock and cost enter the system."
            tabs={TABS}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Purchases workspace views"
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
            {tab === 'bills' && <BillsPanel />}
            {tab === 'ageing' && <AgeingPanel />}
            {tab === 'suppliers' && <SuppliersPanel />}
        </WorkspacePage>
    );
}
