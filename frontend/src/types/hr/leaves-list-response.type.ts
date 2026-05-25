import type { ILeave } from './leave.type';

/**
 * Envelope returned by `GET /hr/leaves` — rows plus pagination
 * metadata. Cashiers are server-scoped to their own employee.
 */
export interface ILeavesListResponse {
    rows: ILeave[];
    total: number;
    limit: number;
    offset: number;
}
