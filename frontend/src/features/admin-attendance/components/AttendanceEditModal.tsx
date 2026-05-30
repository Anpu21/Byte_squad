import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type {
    AttendanceStatus,
    IAttendance,
    IBulkAttendanceRow,
    IEmployee,
} from '@/types';
import { useBulkUpsertAttendance } from '../hooks/useBulkUpsertAttendance';
import {
    STATUS_OPTIONS,
    statusUsesTimes,
} from '../lib/attendance-grid-helpers';

interface AttendanceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: IEmployee | null;
    date: string | null;
    existing: IAttendance | null;
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

function defaultStatusFor(
    existing: IAttendance | null,
    fallback: AttendanceStatus,
): AttendanceStatus {
    return existing?.status ?? fallback;
}

/**
 * Trim a clock-time string to `HH:mm` for the `<input type="time">`.
 * The BE sends `HH:mm:ss`; the input shows seconds only when enabled.
 */
function toHHmm(value: string | null | undefined): string {
    if (!value) return '';
    return value.length > 5 ? value.slice(0, 5) : value;
}

export function AttendanceEditModal({
    isOpen,
    onClose,
    employee,
    date,
    existing,
}: AttendanceEditModalProps) {
    const initialStatus = useMemo<AttendanceStatus>(
        () => defaultStatusFor(existing, 'Present'),
        [existing],
    );
    const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
    const [checkIn, setCheckIn] = useState(toHHmm(existing?.checkInTime));
    const [checkOut, setCheckOut] = useState(toHHmm(existing?.checkOutTime));

    useEffect(() => {
        if (!isOpen) return;
        setStatus(initialStatus);
        setCheckIn(toHHmm(existing?.checkInTime));
        setCheckOut(toHHmm(existing?.checkOutTime));
    }, [isOpen, initialStatus, existing]);

    const bulkMutation = useBulkUpsertAttendance();
    const showTimes = statusUsesTimes(status);

    const dayLabel = useMemo(() => {
        if (!date) return '';
        const [y, m, d] = date.split('-').map(Number);
        return DAY_LABEL_FORMATTER.format(new Date(y, m - 1, d));
    }, [date]);

    async function handleSave() {
        if (!employee || !date) return;
        const row: IBulkAttendanceRow = {
            employeeId: employee.id,
            attendanceDate: date,
            status,
        };
        if (showTimes) {
            if (checkIn) row.checkInTime = checkIn;
            if (checkOut) row.checkOutTime = checkOut;
        }
        try {
            await bulkMutation.mutateAsync({ rows: [row] });
            toast.success('Attendance saved');
            onClose();
        } catch {
            toast.error('Could not save attendance — please retry');
        }
    }

    if (!employee || !date) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit attendance"
            maxWidth="sm"
        >
            <div className="flex flex-col gap-4">
                <div>
                    <p className="text-[13px] font-semibold text-text-1">
                        {employee.fullName}
                    </p>
                    <p className="text-[11px] text-text-3 tabular-nums">
                        {employee.employeeCode} · {dayLabel}
                    </p>
                </div>

                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Status
                    </span>
                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as AttendanceStatus)
                        }
                        aria-label="Attendance status"
                        className={INPUT_CLASS}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>

                {showTimes && (
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Check in
                            </span>
                            <input
                                type="time"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                aria-label="Check-in time"
                                className={INPUT_CLASS}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Check out
                            </span>
                            <input
                                type="time"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                aria-label="Check-out time"
                                className={INPUT_CLASS}
                            />
                        </label>
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={onClose}
                        disabled={bulkMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleSave}
                        disabled={bulkMutation.isPending}
                    >
                        {bulkMutation.isPending ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
