import { useState } from 'react';
import {
    useEmployeeBasicsState,
    type EmployeeBasicsState,
} from './useEmployeeBasicsState';
import {
    useEmployeeContactState,
    type EmployeeContactState,
} from './useEmployeeContactState';
import {
    useEmployeeEmploymentState,
    type EmployeeEmploymentState,
} from './useEmployeeEmploymentState';
import {
    useEmployeePayrollState,
    type EmployeePayrollState,
} from './useEmployeePayrollState';

export interface EmployeeFormErrors {
    employeeCode?: string;
    fullName?: string;
    contactPhone?: string;
    hireDate?: string;
    role?: string;
    branchId?: string;
    email?: string;
    general?: string;
}

export interface EmployeeFormState
    extends EmployeeBasicsState,
        EmployeeContactState,
        EmployeeEmploymentState,
        EmployeePayrollState {
    notes: string;
    setNotes: (v: string) => void;
    errors: EmployeeFormErrors;
    setErrors: (errors: EmployeeFormErrors) => void;
}

/**
 * Composes the per-group state hooks so the form page can pass one
 * `form` bundle down to every card. Each card destructures only the
 * fields it owns — props stay flat and additions to a single group
 * never ripple through every consumer.
 */
export function useEmployeeFormState(): EmployeeFormState {
    const basics = useEmployeeBasicsState();
    const contact = useEmployeeContactState();
    const employment = useEmployeeEmploymentState();
    const payroll = useEmployeePayrollState();
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<EmployeeFormErrors>({});
    return {
        ...basics,
        ...contact,
        ...employment,
        ...payroll,
        notes,
        setNotes,
        errors,
        setErrors,
    };
}
