import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { IHeldBill } from '@/features/pos/types/held-bill.type';

interface IPosHeldBillsModalProps {
    isOpen: boolean;
    onClose: () => void;
    heldBills: IHeldBill[];
    onResume: (id: string) => void;
    onDiscard: (id: string) => void;
}

function billTotal(bill: IHeldBill): number {
    return bill.items.reduce((sum, item) => sum + item.lineTotal, 0);
}

/** Shelf of parked bills — resume swaps it into the cart, discard drops it. */
export function PosHeldBillsModal({
    isOpen,
    onClose,
    heldBills,
    onResume,
    onDiscard,
}: IPosHeldBillsModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Held bills (${heldBills.length})`}
            maxWidth="md"
        >
            {heldBills.length === 0 ? (
                <EmptyState
                    title="No held bills"
                    description="Hold the current bill to serve another customer, then resume it from here."
                />
            ) : (
                <div className="space-y-2">
                    {heldBills.map((bill) => (
                        <div
                            key={bill.id}
                            className="flex items-center gap-3 p-3 rounded-md border border-border bg-surface"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium text-text-1 truncate">
                                    {bill.label}
                                </p>
                                <p className="text-[12px] text-text-3">
                                    {bill.items.length} item
                                    {bill.items.length === 1 ? '' : 's'} ·{' '}
                                    {new Date(bill.heldAt).toLocaleTimeString()}
                                    {bill.heldByName
                                        ? ` · ${bill.heldByName}`
                                        : ''}
                                </p>
                            </div>
                            <span className="text-[13px] font-semibold tabular-nums text-text-1">
                                {formatCurrency(billTotal(bill))}
                            </span>
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => onResume(bill.id)}
                            >
                                Resume
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDiscard(bill.id)}
                            >
                                Discard
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
}
