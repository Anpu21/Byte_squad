import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Segmented from '@/components/ui/Segmented';
import type { ILoyaltyCustomerRow } from '@/types';
import { LoyaltySettingsForm } from '@/features/admin-loyalty/components/LoyaltySettingsForm';
import { LoyaltyCustomersTable } from '@/features/admin-loyalty/components/LoyaltyCustomersTable';
import { LoyaltyCustomerHistoryModal } from '@/features/admin-loyalty/components/LoyaltyCustomerHistoryModal';

type Tab = 'settings' | 'customers';

const TAB_OPTIONS = [
    { label: 'Settings', value: 'settings' as const },
    { label: 'Customers', value: 'customers' as const },
];

export function AdminLoyaltyPage() {
    const [tab, setTab] = useState<Tab>('settings');
    const [selectedCustomer, setSelectedCustomer] =
        useState<ILoyaltyCustomerRow | null>(null);

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
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] gap-6">
                    <LoyaltySettingsForm />
                    <aside className="bg-surface border border-border rounded-md p-5 h-fit">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={14} className="text-text-3" />
                            <h2 className="text-[13px] font-semibold text-text-1">
                                About these settings
                            </h2>
                        </div>
                        <ul className="space-y-2 text-[12px] text-text-2 list-disc list-inside">
                            <li>
                                <span className="text-text-1 font-medium">
                                    Earn rule
                                </span>{' '}
                                — how many points a customer earns for every
                                LKR amount paid at pickup.
                            </li>
                            <li>
                                <span className="text-text-1 font-medium">
                                    Point value
                                </span>{' '}
                                — how much LKR one point is worth when applied
                                to a future order.
                            </li>
                            <li>
                                <span className="text-text-1 font-medium">
                                    Redemption cap
                                </span>{' '}
                                — maximum share of any single order’s subtotal
                                that may be paid in points.
                            </li>
                            <li>
                                Changes apply to new orders only. Existing
                                ledger entries are not adjusted.
                            </li>
                        </ul>
                    </aside>
                </div>
            ) : (
                <LoyaltyCustomersTable onSelectCustomer={setSelectedCustomer} />
            )}

            <LoyaltyCustomerHistoryModal
                customer={selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
            />
        </div>
    );
}
