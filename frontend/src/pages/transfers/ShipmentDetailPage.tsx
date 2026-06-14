import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useShipmentQuery } from '@/features/shipment-tracking/hooks/useShipmentQuery';
import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';
import { ShipmentHeader } from '@/features/shipment-tracking/components/ShipmentHeader';
import { ShipmentTimeline } from '@/features/shipment-tracking/components/ShipmentTimeline';
import { ShipmentLines } from '@/features/shipment-tracking/components/ShipmentLines';
import { ShipmentActions } from '@/features/shipment-tracking/components/ShipmentActions';

export function ShipmentDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    useStockTransferRealtime();
    const { data: shipment, isLoading, isError } = useShipmentQuery(id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !shipment) {
        return (
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1 mb-4"
                >
                    <ArrowLeft size={15} /> Back
                </button>
                <div className="border border-border rounded-xl bg-surface p-8 text-center text-sm text-text-3">
                    This shipment could not be found.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1 mb-4"
            >
                <ArrowLeft size={15} /> Back
            </button>

            <ShipmentHeader shipment={shipment} />

            <div className="mb-4">
                <ShipmentActions shipment={shipment} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ShipmentTimeline events={shipment.events} />
                <ShipmentLines lines={shipment.lines} />
            </div>
        </div>
    );
}
