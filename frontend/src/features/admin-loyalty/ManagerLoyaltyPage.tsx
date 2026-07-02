import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import type { ILoyaltyCustomerRow } from '@/types';
import { LoyaltyCustomersTable } from '@/features/admin-loyalty/components/LoyaltyCustomersTable';
import { LoyaltyCustomerHistorySidebar } from '@/features/admin-loyalty/components/LoyaltyCustomerHistorySidebar';
import { LoyaltyDashboardKpis } from '@/features/admin-loyalty/components/LoyaltyDashboardKpis';
import { LoyaltyAdjustPointsDialog } from '@/features/admin-loyalty/components/LoyaltyAdjustPointsDialog';

export function ManagerLoyaltyPage() {
    const [selectedCustomer, setSelectedCustomer] = useState<ILoyaltyCustomerRow | null>(null);
    const [adjustingCustomer, setAdjustingCustomer] = useState<ILoyaltyCustomerRow | null>(null);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                eyebrow="Manager"
                title="Customer loyalty"
                subtitle="Review who is earning points at your branch and adjust balances if needed."
            />

            <div className="space-y-6">
                <LoyaltyDashboardKpis role="manager" />
                <LoyaltyCustomersTable role="manager" onSelectCustomer={setSelectedCustomer} />
            </div>

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
                    role="manager"
                    memberId={adjustingCustomer.id}
                    customerName={[adjustingCustomer.firstName, adjustingCustomer.lastName].filter(Boolean).join(' ')}
                    isOpen={true}
                    onClose={() => setAdjustingCustomer(null)}
                />
            )}
        </div>
    );
}
