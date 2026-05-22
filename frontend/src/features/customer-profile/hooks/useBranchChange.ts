import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/store/hooks';
import toast from 'react-hot-toast';
import axios from 'axios';
import { userService } from '@/services/user.service';
import { shopProductsService } from '@/services/shop-products.service';
import { queryKeys } from '@/lib/queryKeys';
import { setUserBranch } from '@/store/slices/authSlice';
import { clearShopCart } from '@/store/slices/shopCartSlice';
import type { IUserProfile } from '@/types';

export function useBranchChange(profile: IUserProfile | undefined) {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [hydratedBranchId, setHydratedBranchId] = useState<string | null>(null);

    // Adjust state during render — sync the picker once when the profile's
    // current branch id arrives, without a setState-in-effect.
    const profileBranchId = profile?.branch?.id ?? null;
    if (profileBranchId && hydratedBranchId !== profileBranchId) {
        setHydratedBranchId(profileBranchId);
        setSelectedBranchId(profileBranchId);
    }

    const branchesQuery = useQuery({
        queryKey: queryKeys.shop.branchesWithStaff(),
        queryFn: shopProductsService.listBranches,
    });

    const updateBranchMutation = useMutation({
        mutationFn: (branchId: string) => userService.updateMyBranch(branchId),
        onSuccess: (_data, branchId) => {
            dispatch(setUserBranch(branchId));
            dispatch(clearShopCart());
            queryClient.invalidateQueries({
                queryKey: queryKeys.profile.self(),
            });
            toast.success('Pickup branch updated');
        },
        onError: (err: unknown) => {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not update branch');
            } else {
                toast.error('Could not update branch');
            }
        },
    });

    return {
        selectedBranchId,
        setSelectedBranchId,
        branches: branchesQuery.data ?? [],
        branchesLoading: branchesQuery.isLoading,
        updateBranchMutation,
    };
}
