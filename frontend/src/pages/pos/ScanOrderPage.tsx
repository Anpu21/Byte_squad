import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { ScanOrderView } from '@/features/scan-order/components/ScanOrderView';

export function ScanOrderPage() {
    const navigate = useNavigate();
    const goToPos = () => navigate(FRONTEND_ROUTES.POS);

    return (
        <div>
            <button
                type="button"
                onClick={goToPos}
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

            <ScanOrderView onDone={goToPos} />
        </div>
    );
}
