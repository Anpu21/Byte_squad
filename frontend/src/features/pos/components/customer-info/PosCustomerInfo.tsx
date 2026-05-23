import { useState } from 'react';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import { useConfirm } from '@/hooks/useConfirm';
import { PosCustomerPickerModal } from './PosCustomerPickerModal';
import {
    PosCustomerSnapshotCard,
    type IPosCustomerSnapshot,
} from './PosCustomerSnapshotCard';
import type { ICustomerSearchRow } from '@/types';

interface IPosCustomerInfoProps {
    customerUserId: string | null;
    onPick: (userId: string | null) => void;
    /**
     * Monotonically-increasing signal token. When this changes, the picker
     * modal opens. Lets the F4 shortcut from `PosActionButtons` open the
     * picker without lifting the modal state out of this component.
     */
    openPickerSignal?: number;
}

const toSnapshot = (row: ICustomerSearchRow): IPosCustomerSnapshot => ({
    userId: row.userId,
    displayName: `${row.firstName} ${row.lastName}`.trim(),
    phone: row.phone,
    currentBalance: row.currentBalance,
});

/**
 * Customer card for the POS workspace. Thin orchestrator over the picker
 * modal and the snapshot card. The parent (PosPage) owns
 * `customerUserId`; the local snapshot caches the picked row so we can
 * display name/phone/balance without a follow-up fetch. The detach action
 * is gated behind `useConfirm` so a stray click can't wipe the customer.
 */
export function PosCustomerInfo({
    customerUserId,
    onPick,
    openPickerSignal,
}: IPosCustomerInfoProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [snapshot, setSnapshot] = useState<IPosCustomerSnapshot | null>(
        null,
    );
    const confirm = useConfirm();

    // Adjust-during-render anchor: drop the snapshot when the parent
    // forces customerUserId to null externally (e.g., clear-cart). The
    // anchor prevents us from undoing a fresh pick before the parent has
    // lifted state in response to `onPick`.
    const [observedId, setObservedId] = useState<string | null>(
        customerUserId,
    );
    if (customerUserId !== observedId) {
        setObservedId(customerUserId);
        if (customerUserId === null && snapshot !== null) setSnapshot(null);
    }

    // Adjust-during-render anchor for external picker-open requests (F4).
    // We track the signal token; when the parent bumps it, we open the
    // picker exactly once per change without depending on effects.
    const [observedSignal, setObservedSignal] = useState<number | undefined>(
        openPickerSignal,
    );
    if (openPickerSignal !== observedSignal) {
        setObservedSignal(openPickerSignal);
        if (
            openPickerSignal !== undefined &&
            observedSignal !== undefined &&
            !pickerOpen
        ) {
            setPickerOpen(true);
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

    const handlePick = (row: ICustomerSearchRow | null) => {
        if (row === null) {
            setSnapshot(null);
            onPick(null);
        } else {
            const next = toSnapshot(row);
            setSnapshot(next);
            onPick(next.userId);
        }
        setPickerOpen(false);
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
                <PosCustomerSnapshotCard
                    snapshot={snapshot}
                    onChange={() => setPickerOpen(true)}
                    onDetach={handleDetach}
                />
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
                onSelect={handlePick}
            />
        </section>
    );
}
