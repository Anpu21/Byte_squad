import { useProfileQuery } from '@/features/customer-profile/hooks/useProfileQuery';
import { useProfileMutations } from '@/features/customer-profile/hooks/useProfileMutations';
import { usePersonalInfo } from '@/features/customer-profile/hooks/usePersonalInfo';
import { usePasswordChange } from '@/features/customer-profile/hooks/usePasswordChange';
import { useAuth } from '@/hooks/useAuth';

function buildInitials(
    profileFirst?: string,
    profileLast?: string,
    authFirst?: string,
    authLast?: string,
): string {
    if (profileFirst && profileLast) {
        return `${profileFirst.charAt(0)}${profileLast.charAt(0)}`;
    }
    if (authFirst && authLast) {
        return `${authFirst.charAt(0)}${authLast.charAt(0)}`;
    }
    return '??';
}

export function useAdminProfilePage() {
    const { user } = useAuth();
    const { data: profile, isLoading } = useProfileQuery();
    const personal = usePersonalInfo(profile);
    const { updateProfile, uploadAvatar } = useProfileMutations();
    const password = usePasswordChange();

    const initials = buildInitials(
        profile?.firstName,
        profile?.lastName,
        user?.firstName,
        user?.lastName,
    );

    const saveProfile = () => {
        updateProfile.mutate({
            firstName: personal.firstName,
            lastName: personal.lastName,
            phone: profile?.phone ?? null,
        });
    };

    return {
        profile,
        isLoading,
        initials,
        personal,
        password,
        saveProfile,
        savingProfile: updateProfile.isPending,
        onUploadAvatar: uploadAvatar.mutate,
    };
}
