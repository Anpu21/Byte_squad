import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { clearShopCart } from '@/store/slices/shopCartSlice';
import {
    selectShopCartItems,
    selectShopCartTotal,
    selectShopCartGroups,
} from '@/store/selectors/shopCart';
import { customerOrdersService } from '@/services/customer-orders.service';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { CustomerOrderPaymentMode } from '@/types';

export function useCheckout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const items = useAppSelector(selectShopCartItems);
    const groups = useAppSelector(selectShopCartGroups);
    const total = useAppSelector(selectShopCartTotal);

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
    const { data: loyaltySettings } = useQuery({
        queryKey: queryKeys.loyalty.settings(),
        queryFn: loyaltyService.getSettings,
    });

    const availablePoints = loyalty?.pointsBalance ?? 0;
    const pointValue =
        loyaltySettings && loyaltySettings.pointValue > 0
            ? loyaltySettings.pointValue
            : 1;
    const redeemableBalance = Math.max(
        0,
        availablePoints - (loyaltySettings?.minRedeemablePoints ?? 0),
    );
    const maxBySubtotal = Math.floor(
        (total * (loyaltySettings?.redeemCapPercent ?? 20)) / 100 / pointValue,
    );
    const maxRedeemable = Math.min(redeemableBalance, maxBySubtotal);
    const redeemingPoints = Math.min(loyaltyPointsToRedeem, maxRedeemable);
    const loyaltyDiscount = redeemingPoints * pointValue;
    const finalTotal = Math.max(0, total - loyaltyDiscount);
    const expectedPoints = loyaltySettings
        ? loyaltySettings.earnPerAmount > 0 && loyaltySettings.earnPoints > 0
            ? Math.floor(
                  (finalTotal / loyaltySettings.earnPerAmount) *
                      loyaltySettings.earnPoints,
              )
            : 0
        : Math.floor(finalTotal / 100);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (items.length === 0) {
            setError('Your cart is empty');
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const result = await customerOrdersService.checkout({
                items: items.map((i) => ({
                    productId: i.productId,
                    branchId: i.branchId,
                    unitId: i.unitId ?? undefined,
                    quantity: i.quantity,
                    // Firm cash for "buy by amount" lines; the server validates
                    // it against quantity × unit price and charges it exactly.
                    amount: i.amount ?? undefined,
                })),
                note: note.trim() || undefined,
                paymentMode,
                loyaltyPointsToRedeem: redeemingPoints,
            });
            toast.success(
                paymentMode === 'online'
                    ? 'Redirecting to PayHere'
                    : 'Pickup order(s) created',
            );
            const itemCount = items.length;
            dispatch(clearShopCart());
            queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.mine() });
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'history'] });
            queryClient.invalidateQueries({
                queryKey: queryKeys.customerOrders.my(),
            });

            if (result.payment) {
                const groupFinal = result.orders.reduce(
                    (sum, o) => sum + Number(o.finalTotal),
                    0,
                );
                navigate(FRONTEND_ROUTES.SHOP_CHECKOUT_PAY, {
                    state: {
                        payment: result.payment,
                        orderCode: result.orders[0]?.orderCode ?? result.groupCode,
                        branchName:
                            result.orders.length === 1
                                ? (result.orders[0]?.branch?.name ?? '')
                                : `${result.orders.length} branches`,
                        finalTotal: groupFinal,
                        itemCount,
                    },
                });
                return;
            }
            navigate(
                FRONTEND_ROUTES.SHOP_ORDER_GROUP.replace(':code', result.groupCode),
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
        groups,
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
