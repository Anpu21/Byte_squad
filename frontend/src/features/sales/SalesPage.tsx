import { useMemo } from 'react';
import { ScrollText, ShoppingCart, BadgePercent, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { useTabParam } from '@/hooks/useTabParam';
import { TransactionsPage } from '@/features/transactions';
import { CustomerOrdersPage } from '@/features/customer-orders';
import { DiscountSchemesPage } from '@/features/schemes';
import { SalesmanReportPanel } from '@/features/reports/components/SalesmanReportPanel';

export type SalesTab = 'transactions' | 'orders' | 'schemes' | 'salesman';

interface SalesTabConfig extends TabItem<SalesTab> {
    roles: UserRole[];
}

/**
 * Single source of truth for the Sales hub — each tab's label, icon, the roles
 * allowed to see it, and (below) the surface it renders. Cashiers see the two
 * till-facing tabs; admins/managers also get discount schemes and the salesman
 * report. Mirrors the Accounting hub, built on the shared Tabs primitive.
 */
const TABS: SalesTabConfig[] = [
    {
        key: 'transactions',
        label: 'Transactions',
        Icon: ScrollText,
        roles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        key: 'orders',
        label: 'Customer orders',
        Icon: ShoppingCart,
        roles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        key: 'schemes',
        label: 'Discount schemes',
        Icon: BadgePercent,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        key: 'salesman',
        label: 'Salesman report',
        Icon: BarChart3,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
];

export function SalesPage() {
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const allowedTabs = useMemo<SalesTabConfig[]>(
        () => (role ? TABS.filter((t) => t.roles.includes(role)) : []),
        [role],
    );
    const allowedKeys = useMemo<SalesTab[]>(
        () => allowedTabs.map((t) => t.key),
        [allowedTabs],
    );

    const { tab, setTab } = useTabParam<SalesTab>({
        valid: allowedKeys,
        fallback: allowedKeys[0] ?? 'transactions',
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs
                tabs={allowedTabs}
                active={tab}
                onChange={setTab}
                ariaLabel="Sales workspace views"
            />
            {tab === 'transactions' && <TransactionsPage />}
            {tab === 'orders' && <CustomerOrdersPage />}
            {tab === 'schemes' && <DiscountSchemesPage />}
            {tab === 'salesman' && <SalesmanReportPanel />}
        </div>
    );
}
