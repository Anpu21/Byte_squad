import { useState } from 'react';
import { UserRound, Phone, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import { useConfirm } from '@/hooks/useConfirm';
import { formatCurrency } from '@/lib/utils';
import { PosCustomerPickerModal } from './PosCustomerPickerModal';

interface IPosCustomerInfoProps {
    customerUserId: string | null;
    onPick: (userId: string | null) => void;
}

/**
 * Customer card for the POS workspace. Two display modes:
 *   - When `customerUserId` is null: a "Walk-in customer" pill with an
 *     "Attach customer" CTA that opens the picker modal.
 *   - When set: customer name, phone, and the running ledger balance with
 *     a color-coded tone (danger when the customer owes the store, info
 *     when the store owes the customer / has store credit). "Change" and
 *     "Detach" actions live next to the balance.
 *
 * The parent (PosPage) owns the selected customer id; this component is a
 * thin display + dispatcher.
 *
 * The current customer's row is pulled from a single-row search by id —
 * the picker hook already produces matched rows, so a parent that just
 * passes the id back gets a free hydration via the same query cache.
 * Until that's wired (Phase 14), we render whatever the picker last
 * surfaced via local state captured in `onSelect`.
 */
export function PosCustomerInfo({
    customerUserId,
    onPick,
}: IPosCustomerInfoProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [snapshot, setSnapshot] = useState<{
        userId: string;
        displayName: string;
        phone: string | null;
        currentBalance: number;
    } | null>(null);
    const confirm = useConfirm();

    // Keep the snapshot consistent with the parent's id — if the parent
    // detaches the customer externally (e.g., via a clear-cart flow), drop
    // the snapshot so the empty state shows. Anchor the parent's last
    // observed value so we only react to *changes* and don't fight a
    // freshly-set snapshot that the parent hasn't yet lifted into its own
    // state (the picker calls setSnapshot + onPick in the same tick).
    const [lastObservedId, setLastObservedId] = useState<string | null>(
        customerUserId,
    );
    if (customerUserId !== lastObservedId) {
        setLastObservedId(customerUserId);
        if (customerUserId === null && snapshot !== null) {
            setSnapshot(null);
        }
    }

    const handleDetach = async () => {
        const ok = await confirm({
            title: 'Detach customer?',
            body: 'The current sale will be marked as walk-in. Any pending credit must be re-attached before charging.',
            confirmLabel: 'Detach',
            tone: 'danger',
        });
        if (!ok) return;
        setSnapshot(null);
        onPick(null);
    };

    return (
        <section
            aria-label="Customer"
            className="bg-surface border border-border-strong rounded-lg p-4 flex flex-col gap-3"
        >
            <header className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-3">
                    Customer
                </h3>
                {!customerUserId && (
                    <Pill tone="neutral">Walk-in customer</Pill>
                )}
            </header>

            {customerUserId && snapshot ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-soft text-primary-soft-text">
                            <UserRound size={16} aria-hidden />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-text-1 truncate">
                                {snapshot.displayName}
                            </div>
                            {snapshot.phone && (
                                <div className="flex items-center gap-1.5 text-[12px] text-text-2">
                                    <Phone size={12} aria-hidden />
                                    <span className="tabular-nums">
                                        {snapshot.phone}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] uppercase tracking-wide text-text-3">
                                Balance
                            </span>
                            <span
                                className={`text-[13px] font-semibold tabular-nums ${
                                    snapshot.currentBalance > 0
                                        ? 'text-danger'
                                        : snapshot.currentBalance < 0
                                          ? 'text-info'
                                          : 'text-text-1'
                                }`}
                            >
                                {formatCurrency(
                                    Math.abs(snapshot.currentBalance),
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setPickerOpen(true)}
                        >
                            Change
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDetach}
                            aria-label="Detach customer"
                        >
                            <X size={14} aria-hidden /> Detach
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                    className="self-start"
                >
                    Attach customer
                </Button>
            )}

            <PosCustomerPickerModal
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(row) => {
                    if (row === null) {
                        setSnapshot(null);
                        onPick(null);
                    } else {
                        setSnapshot({
                            userId: row.userId,
                            displayName: `${row.firstName} ${row.lastName}`.trim(),
                            phone: row.phone,
                            currentBalance: row.currentBalance,
                        });
                        onPick(row.userId);
                    }
                    setPickerOpen(false);
                }}
            />
        </section>
    );
}
