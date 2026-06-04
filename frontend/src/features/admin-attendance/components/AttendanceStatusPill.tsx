import Pill, { type PillTone } from '@/components/ui/Pill';
import type { AttendanceStatus } from '@/types';

const STATUS_META: Record<
    AttendanceStatus,
    { tone: PillTone; label: string; short: string }
> = {
    Present: { tone: 'primary', label: 'Present', short: 'Pres' },
    Absent: { tone: 'danger', label: 'Absent', short: 'Abs' },
    Half_Day: { tone: 'warning', label: 'Half day', short: 'Half' },
    Leave: { tone: 'info', label: 'Leave', short: 'Leave' },
    Holiday: { tone: 'success', label: 'Holiday', short: 'Hol' },
    Weekend: { tone: 'neutral', label: 'Weekend', short: 'Wknd' },
};

interface AttendanceStatusPillProps {
    status: AttendanceStatus;
    /** Compact form for tight calendar cells. */
    compact?: boolean;
}

export function AttendanceStatusPill({
    status,
    compact = false,
}: AttendanceStatusPillProps) {
    const meta = STATUS_META[status];
    return <Pill tone={meta.tone}>{compact ? meta.short : meta.label}</Pill>;
}

// eslint-disable-next-line react-refresh/only-export-components -- small label helper co-located with the pill
export function attendanceStatusLabel(status: AttendanceStatus): string {
    return STATUS_META[status].label;
}
