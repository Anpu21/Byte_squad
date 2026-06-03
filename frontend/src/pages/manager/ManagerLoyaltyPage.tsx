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
                {/* 
                  LoyaltyCustomersTable internally fetches with useLoyaltyCustomers,
                  which will automatically scope to the manager's branch on the backend 
                  via the /admin/loyalty/customers endpoint or a /manager counterpart.
                  Wait, does it use /admin or /manager? 
                  The backend plan exposed manager routes at /manager/loyalty/customers.
                  If LoyaltyCustomersTable uses useLoyaltyCustomers which uses loyaltyAdminService which hardcodes /admin/loyalty, 
                  the manager's request to /admin/loyalty will be forbidden!
                  I need to check how useLoyaltyCustomers fetches data. 
                */}
                <LoyaltyCustomersTable role="manager" onSelectCustomer={setSelectedCustomer} />
            </div>

            <LoyaltyCustomerHistorySidebar
                role="manager"
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
                    userId={adjustingCustomer.id}
                    customerName={[adjustingCustomer.firstName, adjustingCustomer.lastName].filter(Boolean).join(' ')}
                    isOpen={true}
                    onClose={() => setAdjustingCustomer(null)}
                />
            )}
        </div>
    );
}
