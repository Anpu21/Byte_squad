import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LuPrinter as Printer } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import type { IPosShift, IShiftLiveSummary } from '@/types';
import { useShiftMutations } from '../../hooks/useShiftMutations';
import { PosShiftZPrint } from './PosShiftZPrint';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

interface IPosShiftCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
    shift: IPosShift;
    live: IShiftLiveSummary | null;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-[13px] text-text-2">
            <span>{label}</span>
            <span className="tabular-nums text-text-1">{value}</span>
        </div>
    );
}

/**
 * Day-end close: shows the live tender summary and drawer target, takes
 * the counted cash, then (after closing) the final over/short with a
 * printable Z-report.
 */
export function PosShiftCloseModal({
    isOpen,
    onClose,
    shift,
    live,
}: IPosShiftCloseModalProps) {
    const { close } = useShiftMutations();
    const [counted, setCounted] = useState('');
    const [notes, setNotes] = useState('');
    const [closedShift, setClosedShift] = useState<IPosShift | null>(null);
    const [printing, setPrinting] = useState(false);

    const countedNum = Number(counted);
    const canClose =
        Number.isFinite(countedNum) && countedNum >= 0 && counted !== '';
    const previewOverShort =
        live && canClose ? countedNum - live.expectedCash : null;

    async function handleClose() {
        if (!canClose || close.isPending) return;
        try {
            const result = await close.mutateAsync({
                countedCash: countedNum,
                notes: notes.trim() || undefined,
            });
            setClosedShift(result);
            toast.success(
                `Shift closed — over/short ${formatCurrency(Number(result.overShort ?? 0))}`,
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not close the shift');
            } else {
                toast.error('Could not close the shift');
            }
        }
    }

    function finish() {
        setClosedShift(null);
        setCounted('');
        setNotes('');
        onClose();
    }

    const summary = closedShift ?? shift;
    const showResult = closedShift !== null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={showResult ? finish : onClose}
                title={showResult ? 'Shift closed' : 'Close shift'}
                maxWidth="md"
                closeOnBackdrop={false}
            >
                <div className="space-y-4">
                    <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface-2/40">
                        <SummaryRow
                            label="Sales"
                            value={`${showResult ? (summary.salesCount ?? 0) : (live?.salesCount ?? 0)} · ${formatCurrency(Number(showResult ? (summary.salesTotal ?? 0) : (live?.salesTotal ?? 0)))}`}
                        />
                        <SummaryRow
                            label="Cash takings"
                            value={formatCurrency(
                                Number(
                                    showResult
                                        ? (summary.totalCash ?? 0)
                                        : (live?.cash ?? 0),
                                ),
                            )}
                        />
                        <SummaryRow
                            label="Card / Mobile"
                            value={formatCurrency(
                                Number(
                                    showResult
                                        ? (summary.totalElectronic ?? 0)
                                        : (live?.electronic ?? 0),
                                ),
                            )}
                        />
                        <SummaryRow
                            label="Cheque / Bank / Credit"
                            value={formatCurrency(
                                Number(
                                    showResult
                                        ? (summary.totalCheque ?? 0)
                                        : (live?.cheque ?? 0),
                                ) +
                                    Number(
                                        showResult
                                            ? (summary.totalBank ?? 0)
                                            : (live?.bank ?? 0),
                                    ) +
                                    Number(
                                        showResult
                                            ? (summary.totalCredit ?? 0)
                                            : (live?.credit ?? 0),
                                    ),
                            )}
                        />
                        <SummaryRow
                            label="Refunds"
                            value={formatCurrency(
                                Number(
                                    showResult
                                        ? (summary.refundsTotal ?? 0)
                                        : (live?.refundsTotal ?? 0),
                                ),
                            )}
                        />
                        <div className="pt-1.5 border-t border-border">
                            <SummaryRow
                                label="Opening float"
                                value={formatCurrency(
                                    Number(summary.openingFloat),
                                )}
                            />
                            <SummaryRow
                                label="Expected cash in drawer"
                                value={formatCurrency(
                                    Number(
                                        showResult
                                            ? (summary.expectedCash ?? 0)
                                            : (live?.expectedCash ?? 0),
                                    ),
                                )}
                            />
                        </div>
                    </div>

                    {!showResult ? (
                        <>
                            <label className="block space-y-1.5">
                                <span className="text-[11px] uppercase tracking-wide text-text-3">
                                    Counted drawer cash
                                </span>
                                <input
                                    className={`${INPUT_CLASS} w-full text-right`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={counted}
                                    onChange={(e) =>
                                        setCounted(e.target.value)
                                    }
                                    placeholder="0.00"
                                />
                            </label>
                            {previewOverShort !== null && (
                                <p
                                    className={`text-sm ${
                                        Math.abs(previewOverShort) < 0.005
                                            ? 'text-accent-text'
                                            : 'text-warning'
                                    }`}
                                >
                                    Over/short preview:{' '}
                                    <span className="font-semibold tabular-nums">
                                        {formatCurrency(previewOverShort)}
                                    </span>
                                </p>
                            )}
                            <input
                                className={`${INPUT_CLASS} w-full`}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notes (optional)"
                                maxLength={500}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    disabled={close.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => void handleClose()}
                                    disabled={!canClose || close.isPending}
                                >
                                    {close.isPending
                                        ? 'Closing…'
                                        : 'Close shift'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-3 rounded-md border border-border">
                                <span className="text-sm text-text-2">
                                    Counted{' '}
                                    <span className="tabular-nums text-text-1">
                                        {formatCurrency(
                                            Number(summary.countedCash ?? 0),
                                        )}
                                    </span>
                                </span>
                                <span
                                    className={`text-sm font-semibold tabular-nums ${
                                        Number(summary.overShort ?? 0) === 0
                                            ? 'text-accent-text'
                                            : 'text-danger'
                                    }`}
                                >
                                    Over/short{' '}
                                    {formatCurrency(
                                        Number(summary.overShort ?? 0),
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setPrinting(true)}
                                >
                                    <Printer size={14} aria-hidden />
                                    Print Z-report
                                </Button>
                                <Button variant="primary" onClick={finish}>
                                    Done
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
            {printing && closedShift && (
                <PosShiftZPrint
                    shift={closedShift}
                    onDone={() => setPrinting(false)}
                />
            )}
        </>
    );
}
