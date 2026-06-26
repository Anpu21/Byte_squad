import { LuClock as Clock, LuLogIn as LogIn, LuLogOut as LogOut } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import type { IAttendance } from '@/types';
import { clockHm } from '@/features/worker-dashboard/lib/attendance-metrics';

interface WorkerShiftCardProps {
    today: IAttendance | null;
    isMutating: boolean;
    onCheckIn: () => void;
    onCheckOut: () => void;
}

/**
 * Prominent clock-in / clock-out control for the worker's home. The
 * button shown depends on today's state: not-yet-in → Clock in,
 * on-shift → Clock out, complete → hours logged.
 */
export function WorkerShiftCard({
    today,
    isMutating,
    onCheckIn,
    onCheckOut,
}: WorkerShiftCardProps) {
    const checkedIn = Boolean(today?.checkInTime);
    const checkedOut = Boolean(today?.checkOutTime);

    let statusText: string;
    if (checkedOut) {
        statusText = `Shift complete · ${clockHm(today?.checkInTime ?? null)}–${clockHm(
            today?.checkOutTime ?? null,
        )}`;
    } else if (checkedIn) {
        statusText = `On shift since ${clockHm(today?.checkInTime ?? null)}`;
    } else {
        statusText = 'Not clocked in yet';
    }

    return (
        <section
            aria-label="Shift attendance"
            className="bg-surface border border-border rounded-md shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary-soft-text">
                    <Clock size={18} aria-hidden />
                </span>
                <div>
                    <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-3">
                        Today's shift
                    </div>
                    <div className="text-sm font-medium text-text-1 mt-0.5">
                        {statusText}
                    </div>
                    {today?.isLate && (
                        <div className="text-xs text-warning mt-0.5">
                            Late by {today.lateMinutes} min
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {!checkedIn && (
                    <Button size="lg" onClick={onCheckIn} disabled={isMutating}>
                        <LogIn size={16} /> Clock in
                    </Button>
                )}
                {checkedIn && !checkedOut && (
                    <Button
                        size="lg"
                        variant="secondary"
                        onClick={onCheckOut}
                        disabled={isMutating}
                    >
                        <LogOut size={16} /> Clock out
                    </Button>
                )}
                {checkedOut && (
                    <span className="text-sm font-medium text-accent-text">
                        {today?.totalHours ?? 0} h logged
                    </span>
                )}
            </div>
        </section>
    );
}
