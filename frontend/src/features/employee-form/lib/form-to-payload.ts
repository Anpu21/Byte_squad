import type { IEmployeePayload } from '@/types';
import type { EmployeeFormState } from '../hooks/useEmployeeFormState';

function trimOrUndefined(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

/**
 * Pack the form state into a wire-shaped `IEmployeePayload`. Empty
 * optional fields collapse to `undefined` rather than `""` so the
 * BE's `Transform(EMPTY_TO_UNDEFINED)` decorators don't have to do
 * defensive work.
 */
export function formToPayload(form: EmployeeFormState): IEmployeePayload {
    return {
        // Required
        employeeCode: form.employeeCode.trim(),
        branchId: form.branchId,
        fullName: form.fullName.trim(),
        contactPhone: form.contactPhone.trim(),
        hireDate: form.hireDate,
        role: form.role.trim(),
        // Optional identity
        nameWithInitials: trimOrUndefined(form.nameWithInitials),
        nic: trimOrUndefined(form.nic),
        dateOfBirth: trimOrUndefined(form.dateOfBirth),
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
        // Optional contact
        contactPhone2: trimOrUndefined(form.contactPhone2),
        email: trimOrUndefined(form.email),
        permanentAddress: trimOrUndefined(form.permanentAddress),
        currentAddress: trimOrUndefined(form.currentAddress),
        city: trimOrUndefined(form.city),
        emergencyContactName: trimOrUndefined(form.emergencyContactName),
        emergencyContactPhone: trimOrUndefined(form.emergencyContactPhone),
        emergencyContactRelationship: trimOrUndefined(
            form.emergencyContactRelationship,
        ),
        // Optional employment
        confirmationDate: trimOrUndefined(form.confirmationDate),
        employeeType: form.employeeType,
        workingHoursStart: trimOrUndefined(form.workingHoursStart),
        workingHoursEnd: trimOrUndefined(form.workingHoursEnd),
        // Optional payroll
        epfEligible: form.epfEligible,
        etfEligible: form.etfEligible,
        epfNumber: trimOrUndefined(form.epfNumber),
        etfNumber: trimOrUndefined(form.etfNumber),
        bankName: trimOrUndefined(form.bankName),
        bankAccountNo: trimOrUndefined(form.bankAccountNo),
        bankBranch: trimOrUndefined(form.bankBranch),
        bankAccountName: trimOrUndefined(form.bankAccountName),
        notes: trimOrUndefined(form.notes),
        status: form.status,
    };
}
