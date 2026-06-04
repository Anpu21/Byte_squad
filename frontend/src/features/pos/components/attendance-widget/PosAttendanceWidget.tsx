import { useState } from 'react';
import axios from 'axios';
import { Clock, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import type { IAttendance } from '@/types';
import { useCheckInSelf } from './useCheckInSelf';
import { useCheckOutSelf } from './useCheckOutSelf';

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

function nowLabel(): string {
    return TIME_FORMATTER.format(new Date());
}

function formatClockTime(time: string | null): string {
    if (!time) return '—';
    return time.slice(0, 5);
}

function describeError(err: unknown): string {
    if (axios.isAxiosError(err) && err.response?.data?.message) {
        const m = err.response.data.message;
        return typeof m === 'string' ? m : 'Could not record attendance';
    }
    return 'Could not record attendance';
}

interface IWidgetState {
    lastAction: 'in' | 'out';
    time: string;
}

/**
 * Cashier-facing clock-in / clock-out widget. Stateless against the
 * BE — we don't pre-fetch today's row, we just fire the mutation and
 * trust the server's rejection on double check-in. The "last
 * action" text is purely a local confirmation echo and resets when
 * the page reloads.
 */
export function PosAttendanceWidget(): React.ReactElement {
    const checkInMutation = useCheckInSelf();
    const checkOutMutation = useCheckOutSelf();
    const [lastEcho, setLastEcho] = useState<IWidgetState | null>(null);

    async function handleCheckIn() {
        try {
            const row: IAttendance = await checkInMutation.mutateAsync();
            const time = formatClockTime(row.checkInTime) || nowLabel();
            setLastEcho({ lastAction: 'in', time });
            toast.success(`Clocked in at ${time}`);
        } catch (err) {
            toast.error(describeError(err));
        }
    }

    async function handleCheckOut() {
        try {
            const row: IAttendance = await checkOutMutation.mutateAsync();
            const time = formatClockTime(row.checkOutTime) || nowLabel();
            setLastEcho({ lastAction: 'out', time });
            toast.success(`Clocked out at ${time}`);
        } catch (err) {
            toast.error(describeError(err));
        }
    }

    const pending =
        checkInMutation.isPending || checkOutMutation.isPending;

    return (
        <section
            aria-label="Shift attendance"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface-2/60"
        >
            <Clock
                size={14}
                aria-hidden
                className="text-text-3 shrink-0"
            />
            <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-text-3">
                    Shift
                </span>
                <span className="text-[11px] tabular-nums text-text-1">
                    {lastEcho
                        ? `${lastEcho.lastAction === 'in' ? 'In' : 'Out'} ${lastEcho.time}`
                        : 'Not clocked in'}
                </span>
            </div>
            <div className="flex gap-1.5 ml-1">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCheckIn}
                    disabled={pending}
                    aria-label="Clock in"
                >
                    <LogIn size={12} />
                    {checkInMutation.isPending ? 'Clocking in…' : 'Clock in'}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCheckOut}
                    disabled={pending}
                    aria-label="Clock out"
                >
                    <LogOut size={12} />
                    {checkOutMutation.isPending ? 'Clocking out…' : 'Clock out'}
                </Button>
            </div>
        </section>
    );
}
