import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LuClock3 as Clock3, LuLock as Lock } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { useCurrentShift } from '../../hooks/useCurrentShift';
import { useShiftMutations } from '../../hooks/useShiftMutations';
import { PosShiftCloseModal } from './PosShiftCloseModal';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

/**
 * Drawer-session controls for the POS header: open a shift with a float,
 * see it ticking, close it through the Z-report flow. Self-contained —
 * owns its modals and the current-shift query.
 */
export function PosShiftControls() {
    const currentQuery = useCurrentShift();
    const { open } = useShiftMutations();
    const [showOpen, setShowOpen] = useState(false);
    const [showClose, setShowClose] = useState(false);
    const [float, setFloat] = useState('');

    const shift = currentQuery.data?.shift ?? null;
    const live = currentQuery.data?.live ?? null;

    const floatNum = Number(float);
    const canOpen =
        Number.isFinite(floatNum) && floatNum >= 0 && float !== '';

    async function handleOpen(e: React.FormEvent) {
        e.preventDefault();
        if (!canOpen || open.isPending) return;
        try {
            await open.mutateAsync(floatNum);
            toast.success('Shift opened — sell away');
            setShowOpen(false);
            setFloat('');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not open the shift');
            } else {
                toast.error('Could not open the shift');
            }
        }
    }

    if (currentQuery.isLoading) return null;

    return (
        <>
            {shift ? (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowClose(true)}
                    title={`Opened ${new Date(shift.openedAt).toLocaleTimeString()} · float ${formatCurrency(Number(shift.openingFloat))}`}
                >
                    <Lock size={14} aria-hidden />
                    Close shift
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowOpen(true)}
                >
                    <Clock3 size={14} aria-hidden />
                    Open shift
                </Button>
            )}

            <Modal
                isOpen={showOpen}
                onClose={() => setShowOpen(false)}
                title="Open shift"
                maxWidth="sm"
                closeOnBackdrop={false}
            >
                <form onSubmit={handleOpen} className="space-y-4">
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Opening float (cash in drawer)
                        </span>
                        <input
                            className={`${INPUT_CLASS} w-full text-right`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={float}
                            onChange={(e) => setFloat(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                        />
                    </label>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowOpen(false)}
                            disabled={open.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!canOpen || open.isPending}
                        >
                            {open.isPending ? 'Opening…' : 'Open shift'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {shift && (
                <PosShiftCloseModal
                    isOpen={showClose}
                    onClose={() => setShowClose(false)}
                    shift={shift}
                    live={live}
                />
            )}
        </>
    );
}
