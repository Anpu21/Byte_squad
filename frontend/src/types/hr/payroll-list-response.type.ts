import type { IPayroll } from './payroll.type';

export interface IPayrollListResponse {
    rows: IPayroll[];
    total: number;
    limit: number;
    offset: number;
}
