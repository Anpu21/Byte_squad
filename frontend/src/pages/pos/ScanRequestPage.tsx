import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronLeft, Keyboard, Lightbulb } from 'lucide-react';
import UniversalScanner from '@/components/Scanner/UniversalScanner';
import { customerRequestsService } from '@/services/customer-requests.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusPill from '@/components/ui/StatusPill';
import Pill from '@/components/ui/Pill';
import type { ICustomerRequest } from '@/types';

type Payment = 'cash' | 'card' | 'mobile';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

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
                className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text-1 mb-4"
            >
                <ChevronLeft size={14} /> Back to POS
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Scan pickup request
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    Hold the customer&apos;s QR code in the frame
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column: viewfinder (~2/3) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Viewfinder</CardTitle>
                            {!request && (
                                <Pill tone="info">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
                                        Scanning…
                                    </span>
                                </Pill>
                            )}
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="relative">
                                <UniversalScanner
                                    onScanSuccess={(text) => void lookup(text)}
                                />
                                {/* Corner brackets overlay */}
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="relative h-56 w-56 max-h-[60%] max-w-[60%]">
                                        <span className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-primary rounded-tl-md" />
                                        <span className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-primary rounded-tr-md" />
                                        <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-primary rounded-bl-md" />
                                        <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-primary rounded-br-md" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column (~1/3) */}
                <div className="space-y-4">
                    {!request ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Or enter code manually</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={handleManualSubmit}
                                        className="space-y-3"
                                    >
                                        <label className="text-[11px] uppercase tracking-widest text-text-3 flex items-center gap-2">
                                            <Keyboard size={12} /> Manual / hardware
                                            scanner
                                        </label>
                                        <input
                                            ref={manualInputRef}
                                            value={manualCode}
                                            onChange={(e) =>
                                                setManualCode(e.target.value)
                                            }
                                            placeholder="REQ-XXXXXXXX"
                                            className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm font-mono text-text-1 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full"
                                        >
                                            {loading ? 'Looking up…' : 'Look up'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="inline-flex items-center gap-2">
                                        <Lightbulb size={14} className="text-warning" />
                                        Tips
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2.5 text-sm text-text-2">
                                        <li className="flex gap-2">
                                            <span className="text-text-3">•</span>
                                            <span>
                                                Allow camera permissions when
                                                prompted by the browser.
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-text-3">•</span>
                                            <span>
                                                Hold the QR code about 15–25 cm
                                                away from the lens.
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-text-3">•</span>
                                            <span>
                                                Ensure even lighting — avoid
                                                glare or strong backlighting.
                                            </span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-mono">
                                    {request.requestCode}
                                </CardTitle>
                                <StatusPill status={request.status} />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-xs text-text-3">
                                    {request.branch?.name} ·{' '}
                                    {request.user
                                        ? `${request.user.firstName} ${request.user.lastName}`
                                        : (request.guestName ?? 'Guest')}{' '}
                                    ·{' '}
                                    {new Date(request.createdAt).toLocaleString()}
                                </p>

                                <div className="space-y-1.5 text-sm">
                                    {request.items.map((it) => (
                                        <div
                                            key={it.id}
                                            className="flex items-center justify-between text-text-1"
                                        >
                                            <span className="truncate pr-2">
                                                {it.product?.name ?? 'Unknown'} ×{' '}
                                                {it.quantity}
                                            </span>
                                            <span className="mono">
                                                {formatCurrency(
                                                    Number(it.unitPriceSnapshot) *
                                                        it.quantity,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-border flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-widest text-text-3">
                                        Estimated total
                                    </span>
                                    <span className="text-lg font-bold text-text-1 mono">
                                        {formatCurrency(
                                            Number(request.estimatedTotal),
                                        )}
                                    </span>
                                </div>

                                {isFulfillable ? (
                                    <>
                                        <div>
                                            <p className="text-[11px] uppercase tracking-widest text-text-3 mb-2">
                                                Payment method
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(
                                                    ['cash', 'card', 'mobile'] as Payment[]
                                                ).map((p) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() =>
                                                            setPaymentMethod(p)
                                                        }
                                                        className={`py-2 text-sm font-semibold rounded-md border transition-colors capitalize ${
                                                            paymentMethod === p
                                                                ? 'bg-primary text-text-inv border-primary'
                                                                : 'bg-surface text-text-1 border-border hover:border-border-strong'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleConfirm}
                                            disabled={submitting}
                                            className="w-full"
                                            size="lg"
                                        >
                                            {submitting
                                                ? 'Charging…'
                                                : `Confirm & charge ${formatCurrency(Number(request.estimatedTotal))}`}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setRequest(null);
                                                setManualCode('');
                                            }}
                                            className="w-full"
                                        >
                                            Scan another
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 rounded-md bg-warning-soft border border-warning/40 text-sm text-warning">
                                            This request is {request.status} and
                                            cannot be charged.
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                setRequest(null);
                                                setManualCode('');
                                            }}
                                            className="w-full"
                                        >
                                            Scan another
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
