import type { IPayroll } from './payroll.type';

/**
 * Returned by `POST /hr/payroll/generate`. `skipped` lists employees
 * the generator could not run for (e.g. no active salary structure)
 * — the BE surfaces these inline instead of throwing so one missing
 * structure does not abort the whole branch run.
 */
export interface IGeneratePayrollResponse {
    rows: IPayroll[];
    skipped: Array<{ employeeId: string; reason: string }>;
}
