import type { EmployeeFormErrors, EmployeeFormState } from '../hooks/useEmployeeFormState';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Required-field check for the employee form. We only enforce the BE
 * non-nullable columns plus a light email syntax check — the full
 * Sri-Lanka phone validation lives on the BE so we don't drift from
 * the canonical regex.
 */
export function validateEmployeeForm(
    form: EmployeeFormState,
): EmployeeFormErrors {
    const errors: EmployeeFormErrors = {};
    if (!form.employeeCode.trim())
        errors.employeeCode = 'Employee code is required';
    if (!form.fullName.trim()) errors.fullName = 'Full name is required';
    if (!form.contactPhone.trim())
        errors.contactPhone = 'Contact phone is required';
    if (!form.hireDate) errors.hireDate = 'Hire date is required';
    if (!form.role.trim()) errors.role = 'Role is required';
    if (!form.branchId) errors.branchId = 'Branch is required';
    if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
        errors.email = 'Enter a valid email';
    }
    return errors;
}
