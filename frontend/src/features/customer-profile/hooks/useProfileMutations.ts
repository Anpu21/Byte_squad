import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/store/hooks';
import toast from 'react-hot-toast';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/lib/queryKeys';
import { setUser } from '@/store/slices/authSlice';

interface UpdatePayload {
    firstName: string;
    lastName: string;
    phone: string | null;
}

export function useProfileMutations() {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();

    const updateProfileMutation = useMutation({
        mutationFn: (data: UpdatePayload) => profileService.updateProfile(data),
        onSuccess: (next) => {
            queryClient.setQueryData(queryKeys.profile.self(), next);
            dispatch(
                setUser({
                    firstName: next.firstName,
                    lastName: next.lastName,
                    phone: next.phone,
                }),
            );
            toast.success('Profile updated');
        },
        onError: () => toast.error('Could not update profile'),
    });

    const avatarMutation = useMutation({
        mutationFn: (file: File) => profileService.uploadAvatar(file),
        onSuccess: (next) => {
            queryClient.setQueryData(queryKeys.profile.self(), next);
            dispatch(setUser({ avatarUrl: next.avatarUrl }));
            toast.success('Avatar updated');
        },
        onError: () =>
            toast.error('Could not upload avatar. Max 2MB, images only.'),
    });

    return {
        updateProfile: updateProfileMutation,
        uploadAvatar: avatarMutation,
    };
}
