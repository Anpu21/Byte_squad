import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { clearShopCart } from '@/store/slices/shopCartSlice';
import {
    selectShopCartItems,
    selectShopCartTotal,
} from '@/store/selectors/shopCart';
import { shopProductsService } from '@/services/shop-products.service';
import { customerOrdersService } from '@/services/customer-orders.service';
import { loyaltyService } from '@/services/loyalty.service';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { CustomerOrderPaymentMode } from '@/types';

export function useCheckout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();
    const items = useAppSelector(selectShopCartItems);
    const branchId = user?.branchId ?? null;
    const total = useAppSelector(selectShopCartTotal);

    const { data: branches = [] } = useQuery({
        queryKey: queryKeys.shop.branches(),
        queryFn: shopProductsService.listBranches,
    });

    const branch = useMemo(
        () => branches.find((b) => b.id === branchId) ?? null,
        [branches, branchId],
    );

    const [note, setNote] = useState('');
    const [paymentMode, setPaymentMode] =
        useState<CustomerOrderPaymentMode>('manual');
    const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: loyalty } = useQuery({
        queryKey: queryKeys.loyalty.mine(),
        queryFn: loyaltyService.getMine,
    });

    const availablePoints = loyalty?.pointsBalance ?? 0;
    const maxRedeemable = Math.min(availablePoints, Math.floor(total * 0.2));
    const redeemingPoints = Math.min(loyaltyPointsToRedeem, maxRedeemable);
    const loyaltyDiscount = redeemingPoints;
    const finalTotal = Math.max(0, total - loyaltyDiscount);
    const expectedPoints = Math.floor(finalTotal / 100);

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
            const result = await customerOrdersService.create({
                branchId,
                items: items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                })),
                note: note.trim() || undefined,
                paymentMode,
                loyaltyPointsToRedeem: redeemingPoints,
            });
            toast.success(
                paymentMode === 'online'
                    ? 'Redirecting to PayHere'
                    : 'Pickup order created',
            );
            const cartItemCount = items.length;
            dispatch(clearShopCart());
            if (result.payment) {
                navigate(FRONTEND_ROUTES.SHOP_CHECKOUT_PAY, {
                    state: {
                        payment: result.payment,
                        orderCode: result.order.orderCode,
                        branchName: branch?.name ?? '',
                        finalTotal: Number(result.order.finalTotal),
                        itemCount: cartItemCount,
                    },
                });
                return;
            }
            navigate(
                FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
                    ':code',
                    result.order.orderCode,
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
                setError(msg ?? 'Could not submit order');
            } else {
                setError('Could not submit order');
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
        availablePoints,
        maxRedeemable,
        redeemingPoints,
        loyaltyPointsToRedeem,
        setLoyaltyPointsToRedeem,
        loyaltyDiscount,
        finalTotal,
        expectedPoints,
        note,
        setNote,
        paymentMode,
        setPaymentMode,
        submitting,
        error,
        onSubmit,
    };
}
