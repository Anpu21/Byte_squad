export interface ListEmployeesQueryKey {
    branchId?: string;
    search?: string;
    status?: 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';
    limit?: number;
    offset?: number;
}

export interface ListAttendanceQueryKey {
    branchId?: string;
    employeeId?: string;
    startDate: string;
    endDate: string;
}

export interface ListLeavesQueryKey {
    branchId?: string;
    employeeId?: string;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface ListPayrollQueryKey {
    branchId?: string;
    employeeId?: string;
    month?: number;
    year?: number;
    status?: 'Pending' | 'Approved' | 'Paid' | 'Cancelled';
    limit?: number;
    offset?: number;
}

export const hr = {
    all: () => ['hr'] as const,
    employees: (params: ListEmployeesQueryKey) =>
        ['hr', 'employees', params] as const,
    employee: (id: string) => ['hr', 'employee', id] as const,
    attendance: (params: ListAttendanceQueryKey) =>
        ['hr', 'attendance', params] as const,
    myAttendance: (params: { startDate: string; endDate: string }) =>
        ['hr', 'attendance', 'me', params] as const,
    todayAttendance: () => ['hr', 'attendance', 'today'] as const,
    branchTodayStatus: (branchId?: string) =>
        ['hr', 'attendance', 'today-status', branchId ?? 'all'] as const,
    leaves: (params: ListLeavesQueryKey) => ['hr', 'leaves', params] as const,
    leave: (id: string) => ['hr', 'leave', id] as const,
    payroll: (params: ListPayrollQueryKey) => ['hr', 'payroll', params] as const,
    payrollOne: (id: string) => ['hr', 'payroll', id] as const,
} as const;
