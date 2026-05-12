import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { FRONTEND_ROUTES } from '@/constants/routes';
import { queryKeys } from '@/lib/queryKeys';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

export default function CheckoutPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();
    const items = useSelector((state: RootState) => state.shopCart.items);
    // The customer's profile pickup branch is the single source of truth.
    // Anything else (including a previously saved cart-level branchId) would
    // route the request to the wrong branch and leave the matching manager
    // unable to find it.
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

    if (items.length === 0) {
        return (
            <div className="text-center py-24 text-text-3 text-sm">
                Your cart is empty.
            </div>
        );
    }

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

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-2">
                Checkout
            </h1>
            <p className="text-sm text-text-2 mb-8">
                We&apos;ll generate a QR for the counter — pay when you pick up.
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs uppercase tracking-widest text-text-3">
                            Pickup branch
                        </label>
                        <Link
                            to={FRONTEND_ROUTES.SHOP}
                            className="text-[11px] text-text-2 hover:text-text-1 underline-offset-4 hover:underline"
                        >
                            Change branch
                        </Link>
                    </div>
                    <div className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm">
                        {branch ? (
                            <>
                                <p className="text-text-1 font-medium">{branch.name}</p>
                                <p className="text-text-2 text-xs mt-0.5">
                                    {branch.address}
                                </p>
                            </>
                        ) : (
                            <p className="text-text-3">Loading branch…</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-text-3 mb-2">
                        Note (optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Any pickup instructions"
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-1 focus:outline-none focus:border-primary resize-none"
                    />
                </div>

                <div className="bg-surface border border-border rounded-md p-5">
                    <p className="text-[11px] uppercase tracking-widest text-text-3 mb-3">
                        Order summary
                    </p>
                    <div className="space-y-1.5 text-sm">
                        {items.map((it) => (
                            <div
                                key={it.productId}
                                className="flex items-center justify-between text-text-1"
                            >
                                <span className="truncate pr-2">
                                    {it.name} × {it.quantity}
                                </span>
                                <span>{formatCurrency(it.sellingPrice * it.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-text-3">
                            Estimated total
                        </span>
                        <span className="text-lg font-bold text-text-1">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-danger-soft border border-danger/40 text-sm text-danger">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || !branchId}
                    className="w-full bg-primary text-text-inv font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Submitting…' : 'Submit pickup request'}
                </button>

                <p className="text-[11px] text-text-3 text-center">
                    You&apos;ll pay at the counter when you pick up. The price shown is an
                    estimate based on today&apos;s prices.
                </p>
            </form>
        </div>
    );
}
