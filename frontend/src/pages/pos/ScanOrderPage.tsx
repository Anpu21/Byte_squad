import { ChevronLeft } from 'lucide-react';
import { useScanOrderPage } from '@/features/scan-order/hooks/useScanOrderPage';
import { ScanViewfinder } from '@/features/scan-order/components/ScanViewfinder';
import { ManualCodeForm } from '@/features/scan-order/components/ManualCodeForm';
import { ScanTipsCard } from '@/features/scan-order/components/ScanTipsCard';
import { OrderSummaryCard } from '@/features/scan-order/components/OrderSummaryCard';

export function ScanOrderPage() {
    const p = useScanOrderPage();

    return (
        <div>
            <button
                type="button"
                onClick={p.goToPos}
                className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text-1 mb-4"
            >
                <ChevronLeft size={14} /> Back to POS
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Scan pickup order
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    Hold the customer&apos;s QR code in the frame
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <ScanViewfinder
                        hasRequest={!!p.request}
                        onScan={(text) => void p.lookup(text)}
                    />
                </div>

                <div className="space-y-4">
                    {!p.request ? (
                        <>
                            <ManualCodeForm
                                manualCode={p.manualCode}
                                setManualCode={p.setManualCode}
                                loading={p.loading}
                                inputRef={p.manualInputRef}
                                onSubmit={p.handleManualSubmit}
                            />
                            <ScanTipsCard />
                        </>
                    ) : (
                        <OrderSummaryCard
                            request={p.request}
                            paymentMethod={p.paymentMethod}
                            onChangePayment={p.setPaymentMethod}
                            isFulfillable={p.isFulfillable}
                            requiresPayment={p.requiresPayment}
                            isOnlineBlocked={p.isOnlineBlocked}
                            submitting={p.submitting}
                            onConfirm={p.handleConfirm}
                            onReset={p.reset}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
