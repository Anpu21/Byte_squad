import { useState, type FormEvent } from 'react';
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
import { publicProductsService } from '@/services/public-products.service';
import { customerRequestsService } from '@/services/customer-requests.service';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

export default function CheckoutPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector((state: RootState) => state.shopCart.items);
    const total = selectCartTotal(items);
    const { isAuthenticated } = useCustomerAuth();

    const { data: branches = [], isLoading: branchesLoading } = useQuery({
        queryKey: ['public-branches'],
        queryFn: publicProductsService.listBranches,
    });

    const [branchId, setBranchId] = useState('');
    const [guestName, setGuestName] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (items.length === 0) {
        return (
            <div className="text-center py-24 text-slate-500 text-sm">
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
                guestName: !isAuthenticated && guestName.trim()
                    ? guestName.trim()
                    : undefined,
                note: note.trim() || undefined,
            });
            toast.success('Pickup request created');
            dispatch(clearShopCart());
            navigate(`/shop/requests/${request.requestCode}`);
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
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                Checkout
            </h1>
            <p className="text-sm text-slate-400 mb-8">
                Choose a branch. We&apos;ll generate a QR for the counter — pay when you
                pick up.
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
                        Pickup branch *
                    </label>
                    <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        required
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">
                            {branchesLoading ? 'Loading…' : 'Select a branch'}
                        </option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name} — {b.address}
                            </option>
                        ))}
                    </select>
                </div>

                {!isAuthenticated && (
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
                            Your name (optional)
                        </label>
                        <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="So staff can call you when ready"
                            className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
                        Note (optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Any pickup instructions"
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">
                        Order summary
                    </p>
                    <div className="space-y-1.5 text-sm">
                        {items.map((it) => (
                            <div
                                key={it.productId}
                                className="flex items-center justify-between text-slate-300"
                            >
                                <span className="truncate pr-2">
                                    {it.name} × {it.quantity}
                                </span>
                                <span>{formatCurrency(it.sellingPrice * it.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-slate-500">
                            Estimated total
                        </span>
                        <span className="text-lg font-bold text-white">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Submitting…' : 'Submit pickup request'}
                </button>

                <p className="text-[11px] text-slate-500 text-center">
                    You&apos;ll pay at the counter when you pick up. The price shown is an
                    estimate based on today&apos;s prices.
                </p>
            </form>
        </div>
    );
}
