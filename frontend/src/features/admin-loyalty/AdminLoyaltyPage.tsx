import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Segmented from '@/components/ui/Segmented';
import type { ILoyaltyCustomerRow } from '@/types';
import { LoyaltySettingsForm } from '@/features/admin-loyalty/components/LoyaltySettingsForm';
import { LoyaltyCustomersTable } from '@/features/admin-loyalty/components/LoyaltyCustomersTable';
import { LoyaltyCustomerHistorySidebar } from '@/features/admin-loyalty/components/LoyaltyCustomerHistorySidebar';
import { LoyaltyDashboardKpis } from '@/features/admin-loyalty/components/LoyaltyDashboardKpis';
import { LoyaltyAdjustPointsDialog } from '@/features/admin-loyalty/components/LoyaltyAdjustPointsDialog';

type Tab = 'settings' | 'customers';

const TAB_OPTIONS = [
    { label: 'Settings', value: 'settings' as const },
    { label: 'Customers', value: 'customers' as const },
];

export function AdminLoyaltyPage() {
    const [tab, setTab] = useState<Tab>('settings');
    const [selectedCustomer, setSelectedCustomer] = useState<ILoyaltyCustomerRow | null>(null);
    const [adjustingCustomer, setAdjustingCustomer] = useState<ILoyaltyCustomerRow | null>(null);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                eyebrow="Admin"
                title="Customer loyalty"
                subtitle="Tune the earn and redemption rules, and review who is earning points."
                actions={
                    <Segmented
                        value={tab}
                        options={TAB_OPTIONS}
                        onChange={setTab}
                    />
                }
            />

            {tab === 'settings' ? (
                <LoyaltySettingsForm />
            ) : (
                <div className="space-y-6">
                    <LoyaltyDashboardKpis role="admin" />
                    <LoyaltyCustomersTable role="admin" onSelectCustomer={setSelectedCustomer} />
                </div>
            )}

            <LoyaltyCustomerHistorySidebar
                customer={selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                onAdjustPoints={() => {
                    if (selectedCustomer) {
                        setAdjustingCustomer(selectedCustomer);
                        setSelectedCustomer(null);
                    }
                }}
            />

            {adjustingCustomer && (
                <LoyaltyAdjustPointsDialog
                    role="admin"
                    memberId={adjustingCustomer.id}
                    customerName={[adjustingCustomer.firstName, adjustingCustomer.lastName].filter(Boolean).join(' ')}
                    isOpen={true}
                    onClose={() => setAdjustingCustomer(null)}
                />
            )}
        </div>
    );
}
