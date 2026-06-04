import type { IEmployee } from './employee.type';

/**
 * Envelope returned by `GET /hr/employees` — paginated rows plus
 * the matching `total` so the FE pager can show "1–20 of 134" and
 * disable the Next button without an additional count query.
 */
export interface IEmployeesListResponse {
    rows: IEmployee[];
    total: number;
    limit: number;
    offset: number;
}
