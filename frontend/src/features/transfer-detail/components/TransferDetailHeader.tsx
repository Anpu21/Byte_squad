import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import type { IStockTransferRequest } from '@/types';

interface TransferDetailHeaderProps {
    transfer: IStockTransferRequest;
    displayQty: number;
}

export function TransferDetailHeader({
    transfer,
    displayQty,
}: TransferDetailHeaderProps) {
    const navigate = useNavigate();
    return (
        <div className="mb-6">
            <button
                type="button"
                onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS)}
                className="text-xs text-text-3 hover:text-text-1 transition-colors mb-3 flex items-center gap-1"
            >
                <ArrowLeft size={14} />
                Back to transfers
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                            {transfer.product.name}
                        </h1>
                        <TransferStatusPill status={transfer.status} />
                    </div>
                    <p className="text-sm text-text-3 mt-1">
                        {displayQty} unit(s) ·{' '}
                        {transfer.sourceBranch?.name ?? 'No source yet'} →{' '}
                        {transfer.destinationBranch.name}
                    </p>
                </div>
            </div>
        </div>
    );
}
