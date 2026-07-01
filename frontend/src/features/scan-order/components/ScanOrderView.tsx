import { useScanOrder } from '../hooks/useScanOrder';
import { ScanViewfinder } from './ScanViewfinder';
import { ManualCodeForm } from './ManualCodeForm';
import { ScanTipsCard } from './ScanTipsCard';
import { OrderSummaryCard } from './OrderSummaryCard';

interface ScanOrderViewProps {
    /** Called after a successful fulfillment (e.g. POS flips back to billing). */
    onDone?: () => void;
}

/**
 * Scan-and-pick body — camera viewfinder beside manual lookup / order
 * summary. Hosted by the POS page's "Scan Pickup" mode; the manual code
 * input autofocuses so hardware wedge scanners land there too.
 */
export function ScanOrderView({ onDone }: ScanOrderViewProps) {
    const p = useScanOrder({ onDone });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <ScanViewfinder onScan={(text) => void p.lookup(text)} />
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
    );
}
