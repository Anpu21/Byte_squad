import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type {
    AttendanceStatus,
    IAttendance,
    IBulkAttendanceRow,
    IEmployee,
} from '@/types';
import { useBulkUpsertAttendance } from '../hooks/useBulkUpsertAttendance';
import {
    STATUS_OPTIONS,
    statusUsesDuration,
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

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

function defaultStatusFor(existing: IAttendance | null): AttendanceStatus {
    // 7-day shop: no weekend default — unmarked days start at Absent.
    return existing ? existing.status : 'Absent';
}

function durationInputFor(totalHours: number | null | undefined): string {
    return totalHours == null ? '' : String(totalHours);
}

function parseDuration(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
        throw new Error('Duration must use up to 2 decimal places');
    }
    const duration = Number(trimmed);
    if (!Number.isFinite(duration) || duration < 0 || duration > 24) {
        throw new Error('Duration must be between 0 and 24 hours');
    }
    return duration;
}

export function AttendanceEditModal({
    isOpen,
    onClose,
    employee,
    date,
    existing,
}: AttendanceEditModalProps) {
    const initialStatus = useMemo<AttendanceStatus>(
        () => defaultStatusFor(existing),
        [existing],
    );
    const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
    const [duration, setDuration] = useState(
        durationInputFor(existing?.totalHours),
    );

    // Re-seed the form to the row being edited each time the modal opens.
    // Intentional state sync on open — not a render-time derivation.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!isOpen) return;
        setStatus(initialStatus);
        setDuration(durationInputFor(existing?.totalHours));
    }, [isOpen, initialStatus, existing]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const bulkMutation = useBulkUpsertAttendance();
    const canUseDuration = statusUsesDuration(status);

    useEffect(() => {
        if (!canUseDuration) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale duration when the status stops using it
            setDuration('');
        }
    }, [canUseDuration]);

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

        if (canUseDuration) {
            try {
                const parsedDuration = parseDuration(duration);
                if (parsedDuration != null) {
                    row.totalHours = parsedDuration;
                }
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : 'Duration is invalid',
                );
                return;
            }
        }

        try {
            await bulkMutation.mutateAsync({ rows: [row] });
            toast.success('Attendance saved');
            onClose();
        } catch {
            toast.error('Could not save attendance - please retry');
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
                        {employee.employeeCode} - {dayLabel}
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

                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Duration hours
                    </span>
                    <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.25"
                        inputMode="decimal"
                        value={duration}
                        disabled={!canUseDuration}
                        onChange={(e) => setDuration(e.target.value)}
                        aria-label="Duration hours"
                        className={INPUT_CLASS}
                    />
                </label>

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
                        {bulkMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
