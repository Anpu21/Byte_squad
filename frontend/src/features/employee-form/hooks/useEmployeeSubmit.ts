import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateEmployee, useUpdateEmployee } from '@/features/admin-employees';
import type { IEmployee } from '@/types';
import { validateEmployeeForm } from '../lib/validate-form';
import { formToPayload } from '../lib/form-to-payload';
import type { EmployeeFormState } from './useEmployeeFormState';

interface UseEmployeeSubmitArgs {
    form: EmployeeFormState;
    isEditMode: boolean;
    employeeId: string | null;
    onSuccess: (saved: IEmployee) => void;
}

function isConflictError(err: unknown): boolean {
    return (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 409
    );
}

export function useEmployeeSubmit({
    form,
    isEditMode,
    employeeId,
    onSuccess,
}: UseEmployeeSubmitArgs) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateEmployeeForm(form);
        if (Object.keys(errors).length > 0) {
            form.setErrors(errors);
            return;
        }
        setIsSubmitting(true);
        form.setErrors({});
        const payload = formToPayload(form);
        try {
            const saved =
                isEditMode && employeeId
                    ? await updateMutation.mutateAsync({
                          id: employeeId,
                          payload,
                      })
                    : await createMutation.mutateAsync(payload);
            toast.success(
                isEditMode ? 'Employee updated' : 'Employee created',
            );
            onSuccess(saved);
        } catch (err: unknown) {
            form.setErrors(
                isConflictError(err)
                    ? {
                          employeeCode:
                              'An employee with this code or NIC already exists',
                      }
                    : { general: 'Failed to save employee. Please try again.' },
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return { isSubmitting, handleSubmit };
}
