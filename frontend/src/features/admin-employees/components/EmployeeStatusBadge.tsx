import Pill, { type PillTone } from '@/components/ui/Pill';
import type { IEmployee } from '@/types';

interface IEmployeeStatusBadgeProps {
    status: IEmployee['status'];
}

const STATUS_MAP: Record<IEmployee['status'], { tone: PillTone; label: string }> = {
    Active: { tone: 'success', label: 'Active' },
    OnLeave: { tone: 'warning', label: 'On leave' },
    Resigned: { tone: 'neutral', label: 'Resigned' },
    Terminated: { tone: 'danger', label: 'Terminated' },
};

/**
 * Single-source-of-truth pill for an employee's lifecycle status.
 * Lives in the admin-employees feature (not the global StatusPill)
 * so the labels stay specific to HR vocabulary ("On leave" rather
 * than "Away").
 */
export function EmployeeStatusBadge({ status }: IEmployeeStatusBadgeProps) {
    const meta = STATUS_MAP[status];
    return <Pill tone={meta.tone}>{meta.label}</Pill>;
}
