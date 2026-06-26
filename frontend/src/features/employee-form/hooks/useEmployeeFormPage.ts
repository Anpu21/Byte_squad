import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useEmployeeFormState } from './useEmployeeFormState';
import { useEmployeeLoader } from './useEmployeeLoader';
import { useEmployeeSubmit } from './useEmployeeSubmit';
import { useEmployeePhotoUpload } from './useEmployeePhotoUpload';

/**
 * Composes form state + loader + submit + photo upload into a
 * single bundle for `EmployeeFormPage` to consume. Owns the
 * "managers are pinned to their own branch" rule by pre-populating
 * `branchId` for non-admins on the create flow.
 */
export function useEmployeeFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const employeeId = id ?? null;
    const isEditMode = Boolean(employeeId);

    const form = useEmployeeFormState();
    const photo = useEmployeePhotoUpload({ employeeId });
    const loader = useEmployeeLoader({
        employeeId,
        form,
        setPhotoUrl: photo.setPhotoUrl,
    });

    // Managers can't change their branch — preload it on create.
    useEffect(() => {
        if (
            !isEditMode &&
            user?.role !== UserRole.ADMIN &&
            user?.branchId &&
            !form.branchId
        ) {
            form.setBranchId(user.branchId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, user?.role, user?.branchId]);

    const submit = useEmployeeSubmit({
        form,
        isEditMode,
        employeeId,
        onSuccess: (saved) => {
            if (!isEditMode) {
                navigate(
                    FRONTEND_ROUTES.ADMIN_EMPLOYEE_EDIT.replace(
                        ':id',
                        saved.id,
                    ),
                    { replace: true },
                );
            }
        },
    });

    return {
        isEditMode,
        isLoadingEmployee: loader.isLoading,
        form,
        photo,
        isSubmitting: submit.isSubmitting,
        handleSubmit: submit.handleSubmit,
        navigate,
    };
}
