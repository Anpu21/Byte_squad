import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { RootState } from '@/store';
import {
    clearShopCart,
    selectCartTotal,
} from '@/store/slices/shopCartSlice';
import { shopProductsService } from '@/services/shop-products.service';
import { customerRequestsService } from '@/services/customer-requests.service';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function useCheckout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();
    const items = useSelector((state: RootState) => state.shopCart.items);
    const branchId = user?.branchId ?? null;
    const total = selectCartTotal(items);

    const { data: branches = [] } = useQuery({
        queryKey: queryKeys.shop.branches(),
        queryFn: shopProductsService.listBranches,
    });

    const branch = useMemo(
        () => branches.find((b) => b.id === branchId) ?? null,
        [branches, branchId],
    );

    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (items.length > 0 && !branchId) {
            toast.error('Pick a branch before checking out');
            navigate(FRONTEND_ROUTES.SHOP);
        }
    }, [items.length, branchId, navigate]);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!branchId) {
            setError('Please choose a branch');
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const request = await customerRequestsService.create({
                branchId,
                items: items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                })),
                note: note.trim() || undefined,
            });
            toast.success('Pickup request created');
            dispatch(clearShopCart());
            navigate(
                FRONTEND_ROUTES.SHOP_REQUEST_CONFIRMATION.replace(
                    ':code',
                    request.requestCode,
                ),
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string | string[] }
                    | undefined;
                const msg = Array.isArray(data?.message)
                    ? data.message.join(', ')
                    : data?.message;
                setError(msg ?? 'Could not submit request');
            } else {
                setError('Could not submit request');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return {
        items,
        branchId,
        branch,
        total,
        note,
        setNote,
        submitting,
        error,
        onSubmit,
    };
}
