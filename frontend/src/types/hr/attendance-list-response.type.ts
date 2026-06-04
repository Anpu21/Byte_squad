import type { IAttendance } from './attendance.type';

/**
 * Envelope returned by `GET /hr/attendance` — rows plus the matching
 * total. No `limit`/`offset` because the endpoint is date-range
 * scoped (start/end), not paginated.
 */
export interface IAttendanceListResponse {
    rows: IAttendance[];
    total: number;
}
