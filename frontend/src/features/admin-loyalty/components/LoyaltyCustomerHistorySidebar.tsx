import { LuLoaderCircle as Loader2, LuX as X } from 'react-icons/lu';
import EmptyState from '@/components/ui/EmptyState';
import type { ILoyaltyCustomerRow } from '@/types';
import { LoyaltyHistoryRow } from '@/features/loyalty/components/LoyaltyHistoryRow';
import { useLoyaltyCustomerHistory } from '../hooks/useLoyaltyCustomerHistory';
import { LoyaltyTierBadge } from './LoyaltyTierBadge';
import { LoyaltyTierProgress } from './LoyaltyTierProgress';
import Button from '@/components/ui/Button';

interface LoyaltyCustomerHistorySidebarProps {
    customer: ILoyaltyCustomerRow | null;
    onClose: () => void;
    onAdjustPoints?: () => void;
}

export function LoyaltyCustomerHistorySidebar({
    customer,
    onClose,
    onAdjustPoints,
}: LoyaltyCustomerHistorySidebarProps) {
    const isOpen = customer !== null;
    const { data, isLoading, isError } = useLoyaltyCustomerHistory({
        memberId: customer?.id ?? null,
        limit: 50,
    });

    if (!isOpen || !customer) return null;

    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ');

    return (
        <>
            <div 
                className="fixed inset-0 z-40 bg-black/50 transition-opacity" 
                aria-hidden="true" 
                onClick={onClose}
            />
            <aside
                role="complementary"
                aria-label="Customer history"
                className="fixed top-0 right-0 z-50 h-full w-full sm:w-[500px] bg-surface border-l border-border-strong shadow-2xl flex flex-col transition-transform duration-300"
            >
                <header className="flex flex-col border-b border-border-strong bg-surface-2/30 px-6 py-4 shrink-0 relative">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 inline-flex items-center justify-center w-8 h-8 rounded-md text-text-3 hover:bg-surface-2 hover:text-text-1 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                    >
                        <X size={20} aria-hidden />
                    </button>
                    
                    <div className="flex items-center gap-3 mt-1 mb-1">
                        <h2 className="text-xl font-bold text-text-1">
                            {fullName}
                        </h2>
                        <LoyaltyTierBadge tier={customer.tier} />
                    </div>
                    
                    <p className="text-sm text-text-3">
                        {[customer.phone, customer.email].filter(Boolean).join(' • ')}
                    </p>

                    {onAdjustPoints && (
                        <div className="mt-4">
                            <Button variant="secondary" onClick={onAdjustPoints}>
                                Adjust Points
                            </Button>
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-border bg-surface-2/40 p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-xs text-text-3 uppercase tracking-widest font-semibold mb-1">
                                Balance
                            </p>
                            <p className="text-2xl font-bold text-text-1 tabular-nums">
                                {customer.pointsBalance.toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface-2/40 p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-xs text-text-3 uppercase tracking-widest font-semibold mb-1">
                                Earned
                            </p>
                            <p className="text-2xl font-semibold text-text-2 tabular-nums">
                                {customer.lifetimePointsEarned.toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface-2/40 p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-xs text-text-3 uppercase tracking-widest font-semibold mb-1">
                                Redeemed
                            </p>
                            <p className="text-2xl font-semibold text-text-2 tabular-nums">
                                {customer.lifetimePointsRedeemed.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border p-5 bg-surface-2/20">
                        <h3 className="text-sm font-semibold mb-4 text-text-1">Tier Progress</h3>
                        <LoyaltyTierProgress 
                            tier={customer.tier} 
                            lifetimePoints={customer.lifetimePointsEarned} 
                        />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-text-1">Ledger History</h3>
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        )}

                        {isError && (
                            <div className="bg-danger-soft border border-danger/40 text-danger rounded-md p-4 text-sm text-center">
                                Could not load history. Please try again.
                            </div>
                        )}

                        {!isLoading && !isError && data?.entries.length === 0 && (
                            <EmptyState
                                title="No activity"
                                description="This customer hasn’t earned or redeemed any points yet."
                            />
                        )}

                        {!isLoading && !isError && data && data.entries.length > 0 && (
                            <div className="bg-surface border border-border rounded-lg px-5">
                                {data.entries.map((entry) => (
                                    <LoyaltyHistoryRow
                                        key={entry.id}
                                        entry={entry}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
