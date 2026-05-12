import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IUserProfile } from '@/types';

export function useProfileQuery() {
    return useQuery<IUserProfile>({
        queryKey: queryKeys.profile.self(),
        queryFn: profileService.getProfile,
    });
}
