import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { shopProductsService } from '@/services/shop-products.service';
import { userService } from '@/services/user.service';
import { setUserBranch, logout } from '@/store/slices/authSlice';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function useBranchSelection() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const {
        data: branches = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: queryKeys.shop.branchesWithStaff(),
        queryFn: shopProductsService.listBranches,
    });

    const headOfficeId = useMemo(() => {
        if (branches.length === 0) return null;
        const top = branches.reduce((max, b) =>
            b.staffCount > max.staffCount ? b : max,
        );
        return top.staffCount > 0 ? top.id : null;
    }, [branches]);

    const handleContinue = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            await userService.updateMyBranch(selectedId);
            dispatch(setUserBranch(selectedId));
            toast.success('Branch saved');
            navigate(FRONTEND_ROUTES.SHOP);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not save branch');
            } else {
                toast.error('Could not save branch');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        dispatch(logout());
        navigate(FRONTEND_ROUTES.LOGIN);
    };

    return {
        branches,
        isLoading,
        isError,
        selectedId,
        setSelectedId,
        headOfficeId,
        submitting,
        handleContinue,
        handleBack,
    };
}
