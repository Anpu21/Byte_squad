import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { IEmployee, LeaveType } from '@/types';
import { useApplyLeave } from '../hooks/useApplyLeave';
import { LEAVE_TYPES, inclusiveDays } from '../lib/leave-formatting';

interface IApplyLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Selectable employees (manager/admin on-behalf flows). */
    employees: IEmployee[];
    /**
     * Self-apply flows (cashier) hide the employee picker — the BE
     * resolves the actor's own employee record when the id is omitted.
     */
    hideEmployee?: boolean;
}

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

/**
 * Outer shell mounts the form only while open so each open starts
 * with fresh local state — no resetting effects needed.
 */
export function ApplyLeaveModal({
    isOpen,
    onClose,
    employees,
    hideEmployee = false,
}: IApplyLeaveModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Apply for leave"
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            {isOpen ? (
                <ApplyLeaveForm
                    onClose={onClose}
                    employees={employees}
                    hideEmployee={hideEmployee}
                />
            ) : null}
        </Modal>
    );
}

interface IApplyLeaveFormProps {
    onClose: () => void;
    employees: IEmployee[];
    hideEmployee?: boolean;
}

/**
 * Apply-for-leave form. Auto-suggests `totalDays` from the inclusive
 * date range — recomputed on every render via useMemo, with the
 * user's explicit override winning when set.
 */
function ApplyLeaveForm({
    onClose,
    employees,
    hideEmployee = false,
}: IApplyLeaveFormProps) {
    const apply = useApplyLeave();
    const [employeeId, setEmployeeId] = useState('');
    const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [daysOverride, setDaysOverride] = useState('');
    const [reason, setReason] = useState('');

    const suggestedDays = useMemo(
        () => inclusiveDays(startDate, endDate),
        [startDate, endDate],
    );

    const effectiveDays =
        daysOverride === '' && suggestedDays > 0
            ? String(suggestedDays)
            : daysOverride;
    const daysNum = Number(effectiveDays);
    const canSubmit =
        (hideEmployee || employeeId.length > 0) &&
        startDate.length > 0 &&
        endDate.length > 0 &&
        Number.isFinite(daysNum) &&
        daysNum >= 0.5 &&
        daysNum <= 366 &&
        new Date(startDate).getTime() <= new Date(endDate).getTime();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;
        try {
            await apply.mutateAsync({
                // Omitted on self-apply — the BE targets the actor's
                // own employee record.
                employeeId: hideEmployee ? undefined : employeeId,
                leaveType,
                startDate,
                endDate,
                totalDays: daysNum,
                reason: reason.trim() || undefined,
            });
            toast.success('Leave applied');
            onClose();
        } catch {
            toast.error('Could not apply for leave — check balance + overlaps');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!hideEmployee && (
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Employee
                        </span>
                        <select
                            className={`${INPUT_CLASS} field-select w-full`}
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            required
                        >
                            <option value="">Select…</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.fullName}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Leave type
                    </span>
                    <select
                        className={`${INPUT_CLASS} field-select w-full`}
                        value={leaveType}
                        onChange={(e) =>
                            setLeaveType(e.target.value as LeaveType)
                        }
                    >
                        {LEAVE_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t.replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Start date
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full${(startDate) ? '' : ' date-empty'}`}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        End date
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full${(endDate) ? '' : ' date-empty'}`}
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Total days{' '}
                        {suggestedDays > 0
                            ? `(suggested: ${suggestedDays})`
                            : ''}
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="366"
                        value={effectiveDays}
                        onChange={(e) => setDaysOverride(e.target.value)}
                        required
                    />
                </label>
            </div>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Reason (optional)
                </span>
                <textarea
                    className={`${FIELD_SHELL} ${FIELD_BORDER} w-full min-h-[72px] px-3 py-2`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={1000}
                />
            </label>
            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={apply.isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={apply.isPending || !canSubmit}
                >
                    {apply.isPending ? 'Applying…' : 'Apply'}
                </Button>
            </div>
        </form>
    );
}
