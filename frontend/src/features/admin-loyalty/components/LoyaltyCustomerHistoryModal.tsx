import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import type { ILoyaltyCustomerRow } from '@/types';
import { LoyaltyHistoryRow } from '@/features/loyalty/components/LoyaltyHistoryRow';
import { useLoyaltyCustomerHistory } from '../hooks/useLoyaltyCustomerHistory';

interface LoyaltyCustomerHistoryModalProps {
    customer: ILoyaltyCustomerRow | null;
    onClose: () => void;
}

export function LoyaltyCustomerHistoryModal({
    customer,
    onClose,
}: LoyaltyCustomerHistoryModalProps) {
    const isOpen = customer !== null;
    const { data, isLoading, isError } = useLoyaltyCustomerHistory({
        userId: customer?.id ?? null,
        limit: 50,
    });

    const title = customer
        ? `${customer.firstName} ${customer.lastName} · loyalty`
        : 'Loyalty history';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="2xl"
        >
            {customer && (
                <>
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                        <div className="rounded-md border border-border bg-surface-2/40 py-2">
                            <p className="text-[11px] text-text-3 uppercase tracking-widest">
                                Balance
                            </p>
                            <p className="mono tabular-nums text-lg font-bold text-text-1 mt-0.5">
                                {customer.pointsBalance}
                            </p>
                        </div>
                        <div className="rounded-md border border-border bg-surface-2/40 py-2">
                            <p className="text-[11px] text-text-3 uppercase tracking-widest">
                                Earned
                            </p>
                            <p className="mono tabular-nums text-lg font-semibold text-text-1 mt-0.5">
                                {customer.lifetimePointsEarned}
                            </p>
                        </div>
                        <div className="rounded-md border border-border bg-surface-2/40 py-2">
                            <p className="text-[11px] text-text-3 uppercase tracking-widest">
                                Redeemed
                            </p>
                            <p className="mono tabular-nums text-lg font-semibold text-text-1 mt-0.5">
                                {customer.lifetimePointsRedeemed}
                            </p>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                        </div>
                    )}

                    {isError && (
                        <div className="bg-danger-soft border border-danger/40 text-danger rounded-md p-3 text-xs">
                            Could not load history.
                        </div>
                    )}

                    {!isLoading && !isError && data?.entries.length === 0 && (
                        <EmptyState
                            title="No activity"
                            description="This customer hasn’t earned or redeemed any points yet."
                        />
                    )}

                    {!isLoading &&
                        !isError &&
                        data &&
                        data.entries.length > 0 && (
                            <div className="bg-surface border border-border rounded-md px-4 max-h-[420px] overflow-y-auto">
                                {data.entries.map((entry) => (
                                    <LoyaltyHistoryRow
                                        key={entry.id}
                                        entry={entry}
                                    />
                                ))}
                            </div>
                        )}
                </>
            )}
        </Modal>
    );
}
