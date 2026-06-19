/**
 * Monthly payroll row as returned by `GET /hr/payroll` and the
 * generate/approve/mark-paid mutations. Mirrors the Payroll entity:
 * one row per (employee, payPeriodMonth, payPeriodYear).
 *
 * All decimal columns come through as `number` (BE transformer).
 */
export type PayrollStatus = 'Pending' | 'Approved' | 'Paid' | 'Cancelled';

export type PaymentMethod = 'Cash' | 'Card';

export interface IPayroll {
    id: string;
    employeeId: string;
    payPeriodMonth: number;
    payPeriodYear: number;
    basicSalary: number;
    productionEarnings: number;
    overtimeEarnings: number;
    attendanceBonus: number;
    teaAllowance: number;
    otherAllowances: number;
    grossSalary: number;
    epfEmployeeDeduction: number;
    etfEmployeeDeduction: number;
    advanceDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
    epfEmployerContribution: number;
    etfEmployerContribution: number;
    paymentStatus: PayrollStatus;
    /** ISO date `YYYY-MM-DD`, null until marked Paid. */
    paymentDate: string | null;
    paymentMethod: PaymentMethod;
    /** Optional disbursement reference (e.g. card terminal / transfer ref). */
    paymentReference: string | null;
    paySlipGenerated: boolean;
    paySlipUrl: string | null;
    notes: string | null;
    otherDeductionsReason: string | null;
    otherAllowancesReason: string | null;
    generatedBy: string | null;
    approvedBy: string | null;
    generatedAt: string;
    updatedAt: string;
}
