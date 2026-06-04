import { useState } from 'react';

export type EmployeeTypeField =
    | 'Permanent'
    | 'Contract'
    | 'Casual'
    | 'Intern';

export type EmployeeStatusField =
    | 'Active'
    | 'Resigned'
    | 'Terminated'
    | 'OnLeave';

export interface EmployeeEmploymentState {
    branchId: string;
    setBranchId: (v: string) => void;
    role: string;
    setRole: (v: string) => void;
    employeeType: EmployeeTypeField;
    setEmployeeType: (v: EmployeeTypeField) => void;
    hireDate: string;
    setHireDate: (v: string) => void;
    confirmationDate: string;
    setConfirmationDate: (v: string) => void;
    workingHoursStart: string;
    setWorkingHoursStart: (v: string) => void;
    workingHoursEnd: string;
    setWorkingHoursEnd: (v: string) => void;
    status: EmployeeStatusField;
    setStatus: (v: EmployeeStatusField) => void;
}

export function useEmployeeEmploymentState(): EmployeeEmploymentState {
    const [branchId, setBranchId] = useState('');
    const [role, setRole] = useState('');
    const [employeeType, setEmployeeType] =
        useState<EmployeeTypeField>('Permanent');
    const [hireDate, setHireDate] = useState('');
    const [confirmationDate, setConfirmationDate] = useState('');
    const [workingHoursStart, setWorkingHoursStart] = useState('08:00');
    const [workingHoursEnd, setWorkingHoursEnd] = useState('16:00');
    const [status, setStatus] = useState<EmployeeStatusField>('Active');
    return {
        branchId,
        setBranchId,
        role,
        setRole,
        employeeType,
        setEmployeeType,
        hireDate,
        setHireDate,
        confirmationDate,
        setConfirmationDate,
        workingHoursStart,
        setWorkingHoursStart,
        workingHoursEnd,
        setWorkingHoursEnd,
        status,
        setStatus,
    };
}
