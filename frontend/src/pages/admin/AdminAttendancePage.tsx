import { AttendanceView } from '@/features/admin-attendance/components/AttendanceView';

/**
 * Admin / manager attendance editor. Drives the grid through a
 * month picker + branch + employee filter. The grid itself owns the
 * cell buffer and "Save grid" action.
 */
export function AdminAttendancePage() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AttendanceView />
        </div>
    );
}
