import { hrAttendanceService } from './hr/attendance.service';
import { hrEmployeesService } from './hr/employees.service';
import { hrLeavesService } from './hr/leaves.service';
import { hrPayrollService } from './hr/payroll.service';

export type { IListAttendanceQuery } from './hr/attendance.service';
export type {
    IListEmployeesQuery,
    ITerminateEmployeePayload,
} from './hr/employees.service';
export type { IListLeavesQuery } from './hr/leaves.service';
export type {
    IExportPayrollCsvQuery,
    IGeneratePayrollPayload,
    IListPayrollQuery,
    IMarkPayrollPaidPayload,
} from './hr/payroll.service';

/**
 * HR API client. The BE filters list / read endpoints by
 * `actor.branchId` for non-admins server-side, so the FE only needs
 * to pass through whatever filter chips the user picked — branch
 * scope cannot be widened from the URL.
 *
 * Composed from per-resource clients in `./hr/*` to stay within the
 * `max-lines` budget; the public surface (method set + signatures) is
 * unchanged, so importers keep using `@/services/hr.service` as before.
 */
export const hrService = {
    ...hrEmployeesService,
    ...hrAttendanceService,
    ...hrLeavesService,
    ...hrPayrollService,
};
