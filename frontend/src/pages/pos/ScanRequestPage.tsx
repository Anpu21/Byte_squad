import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronLeft, Keyboard } from 'lucide-react';
import UniversalScanner from '@/components/Scanner/UniversalScanner';
import { customerRequestsService } from '@/services/customer-requests.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { ICustomerRequest, CustomerRequestStatus } from '@/types';

type Payment = 'cash' | 'card' | 'mobile';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

const STATUS_TONE: Record<CustomerRequestStatus, string> = {
    pending: 'bg-warning-soft text-warning border-warning/40',
    completed: 'bg-accent-soft text-accent-text border-accent/40',
    rejected: 'bg-danger-soft text-danger border-danger/40',
    cancelled: 'bg-slate-500/10 text-text-2 border-slate-500/30',
    expired: 'bg-slate-500/10 text-text-2 border-slate-500/30',
};

export default function ScanRequestPage() {
    const navigate = useNavigate();
    const manualInputRef = useRef<HTMLInputElement>(null);
    const [request, setRequest] = useState<ICustomerRequest | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<Payment>('cash');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [manualCode, setManualCode] = useState('');

    const lookup = useCallback(async (codeRaw: string) => {
        const code = codeRaw.trim();
        if (!code) return;
        setLoading(true);
        try {
            const found = await customerRequestsService.findByCodeStaff(code);
            setRequest(found);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                toast.error('Request not found');
            } else {
                toast.error('Lookup failed');
            }
            setRequest(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        manualInputRef.current?.focus();
    }, []);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void lookup(manualCode);
    };

    const handleConfirm = async () => {
        if (!request) return;
        setSubmitting(true);
        try {
            await customerRequestsService.fulfill(request.requestCode, {
                paymentMethod,
            });
            toast.success(
                `Charged ${formatCurrency(Number(request.estimatedTotal))} via ${paymentMethod}`,
            );
            navigate(FRONTEND_ROUTES.POS);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not complete pickup');
            } else {
                toast.error('Could not complete pickup');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const isFulfillable = request?.status === 'pending';

    return (
        <div>
            <button
                type="button"
                onClick={() => navigate(FRONTEND_ROUTES.POS)}
                className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text-1 mb-6"
            >
                <ChevronLeft size={14} /> Back to POS
            </button>

            <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-2">
                Scan Pickup Request
            </h1>
            <p className="text-sm text-text-2 mb-8">
                Point the camera at the customer&apos;s QR — or type / scan the code
                manually.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <UniversalScanner onScanSuccess={(text) => void lookup(text)} />

                    <form
                        onSubmit={handleManualSubmit}
                        className="mt-4 bg-[#111] border border-border rounded-md p-4"
                    >
                        <label className="text-[11px] uppercase tracking-widest text-text-3 mb-2 flex items-center gap-2">
                            <Keyboard size={12} /> Manual / hardware scanner
                        </label>
                        <div className="flex gap-2">
                            <input
                                ref={manualInputRef}
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="REQ-XXXXXXXX"
                                className="flex-1 bg-canvas border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-1 focus:outline-none focus:border-emerald-500"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Looking up…' : 'Look up'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-[#111] border border-border rounded-md p-6">
                    {!request ? (
                        <div className="h-full flex items-center justify-center text-center text-text-3 text-sm py-12">
                            Scan a QR code or enter a request code to begin.
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <p className="font-mono text-sm font-bold text-text-1">
                                    {request.requestCode}
                                </p>
                                <span
                                    className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_TONE[request.status]}`}
                                >
                                    {request.status}
                                </span>
                            </div>

                            <p className="text-xs text-text-3 mb-4">
                                {request.branch?.name} ·{' '}
                                {request.customer
                                    ? `${request.customer.firstName} ${request.customer.lastName}`
                                    : (request.guestName ?? 'Guest')}{' '}
                                · {new Date(request.createdAt).toLocaleString()}
                            </p>

                            <div className="space-y-1.5 text-sm mb-4">
                                {request.items.map((it) => (
                                    <div
                                        key={it.id}
                                        className="flex items-center justify-between text-text-1"
                                    >
                                        <span className="truncate pr-2">
                                            {it.product?.name ?? 'Unknown'} × {it.quantity}
                                        </span>
                                        <span>
                                            {formatCurrency(
                                                Number(it.unitPriceSnapshot) * it.quantity,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-border mb-5 flex items-center justify-between">
                                <span className="text-xs uppercase tracking-widest text-text-3">
                                    Estimated total
                                </span>
                                <span className="text-lg font-bold text-text-1">
                                    {formatCurrency(Number(request.estimatedTotal))}
                                </span>
                            </div>

                            {isFulfillable && (
                                <>
                                    <p className="text-[11px] uppercase tracking-widest text-text-3 mb-2">
                                        Payment method
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 mb-5">
                                        {(['cash', 'card', 'mobile'] as Payment[]).map(
                                            (p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(p)}
                                                    className={`py-2 text-sm font-semibold rounded-lg border transition-colors capitalize ${
                                                        paymentMethod === p
                                                            ? 'bg-primary text-black border-white'
                                                            : 'bg-canvas text-text-1 border-border hover:border-border-strong'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            ),
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={submitting}
                                        className="w-full bg-emerald-500 text-black font-semibold py-2.5 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                    >
                                        {submitting
                                            ? 'Charging…'
                                            : `Confirm & Charge ${formatCurrency(Number(request.estimatedTotal))}`}
                                    </button>
                                </>
                            )}

                            {!isFulfillable && (
                                <div className="p-3 rounded-lg bg-warning-soft border border-warning/40 text-sm text-warning">
                                    This request is {request.status} and cannot be charged.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
