import { useEffect } from 'react';
import { useEmployee } from '@/features/admin-employees/hooks/useEmployee';
import type { EmployeeFormState } from './useEmployeeFormState';
import type {
    GenderField,
    MaritalField,
} from './useEmployeeBasicsState';

interface UseEmployeeLoaderArgs {
    employeeId: string | null;
    form: EmployeeFormState;
    setPhotoUrl: (url: string | null) => void;
}

export function useEmployeeLoader({
    employeeId,
    form,
    setPhotoUrl,
}: UseEmployeeLoaderArgs) {
    const query = useEmployee(employeeId);

    useEffect(() => {
        if (!query.data) return;
        const e = query.data;
        form.setEmployeeCode(e.employeeCode);
        form.setFullName(e.fullName);
        form.setNameWithInitials(e.nameWithInitials ?? '');
        form.setNic(e.nic ?? '');
        form.setDateOfBirth(e.dateOfBirth ?? '');
        form.setGender((e.gender ?? '') as GenderField);
        form.setMaritalStatus((e.maritalStatus ?? '') as MaritalField);
        form.setContactPhone(e.contactPhone);
        form.setContactPhone2(e.contactPhone2 ?? '');
        form.setEmail(e.email ?? '');
        form.setPermanentAddress(e.permanentAddress ?? '');
        form.setCurrentAddress(e.currentAddress ?? '');
        form.setCity(e.city ?? '');
        form.setEmergencyContactName(e.emergencyContactName ?? '');
        form.setEmergencyContactPhone(e.emergencyContactPhone ?? '');
        form.setEmergencyContactRelationship(
            e.emergencyContactRelationship ?? '',
        );
        form.setBranchId(e.branchId);
        form.setRole(e.role);
        form.setEmployeeType(e.employeeType);
        form.setHireDate(e.hireDate);
        form.setConfirmationDate(e.confirmationDate ?? '');
        form.setWorkingHoursStart(e.workingHoursStart.slice(0, 5));
        form.setWorkingHoursEnd(e.workingHoursEnd.slice(0, 5));
        form.setStatus(e.status);
        form.setEpfEligible(e.epfEligible);
        form.setEtfEligible(e.etfEligible);
        form.setEpfNumber(e.epfNumber ?? '');
        form.setEtfNumber(e.etfNumber ?? '');
        form.setBankName(e.bankName ?? '');
        form.setBankAccountNo(e.bankAccountNo ?? '');
        form.setBankBranch(e.bankBranch ?? '');
        form.setBankAccountName(e.bankAccountName ?? '');
        form.setNotes(e.notes ?? '');
        setPhotoUrl(e.photoUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.data]);

    useEffect(() => {
        if (query.error) {
            form.setErrors({ general: 'Failed to load employee' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.error]);

    return { isLoading: query.isLoading && Boolean(employeeId) };
}
