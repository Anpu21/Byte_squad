import { UserRound, Phone, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

export interface IPosCustomerSnapshot {
    userId: string;
    displayName: string;
    phone: string | null;
    currentBalance: number;
}

interface IPosCustomerSnapshotCardProps {
    snapshot: IPosCustomerSnapshot;
    onChange: () => void;
    onDetach: () => void;
}

/**
 * Card that renders the currently-attached customer's name, phone, and
 * running ledger balance, alongside Change / Detach actions. Pure
 * presentational — the snapshot, click handlers, and confirm prompt are
 * owned by `PosCustomerInfo`.
 *
 * `currentBalance` is color-coded: positive = danger tone (customer owes),
 * negative = info tone (store credit), zero = neutral.
 */
export function PosCustomerSnapshotCard({
    snapshot,
    onChange,
    onDetach,
}: IPosCustomerSnapshotCardProps) {
    const balanceTone =
        snapshot.currentBalance > 0
            ? 'text-danger'
            : snapshot.currentBalance < 0
              ? 'text-info'
              : 'text-text-1';

    return (
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
                        className={`text-[13px] font-semibold tabular-nums ${balanceTone}`}
                    >
                        {formatCurrency(Math.abs(snapshot.currentBalance))}
                    </span>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onChange}
                >
                    Change
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDetach}
                    aria-label="Detach customer"
                >
                    <X size={14} aria-hidden /> Detach
                </Button>
            </div>
        </div>
    );
}
