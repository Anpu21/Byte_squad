import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import type { IStockTransferRequest } from '@/types';

interface TransferDetailHeaderProps {
    transfer: IStockTransferRequest;
}

export function TransferDetailHeader({ transfer }: TransferDetailHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="mb-5">
            <button
                type="button"
                onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS)}
                className="text-xs text-text-3 hover:text-text-1 transition-colors mb-3 flex items-center gap-1"
            >
                <ArrowLeft size={14} />
                Back to transfers
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                            {transfer.product.name}
                        </h1>
                        <TransferStatusPill status={transfer.status} />
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-[13px]">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-2 border border-border font-medium text-text-2">
                            {transfer.sourceBranch?.name ?? 'No source yet'}
                        </span>
                        <ArrowRight size={15} className="text-text-3 flex-shrink-0" />
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-soft border border-primary/20 font-medium text-primary-soft-text">
                            {transfer.destinationBranch.name}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <div className="text-center px-4 py-2 rounded-xl bg-surface-2 border border-border min-w-[84px]">
                        <p className="text-[10px] uppercase tracking-wide text-text-3 font-semibold">
                            Requested
                        </p>
                        <p className="text-lg font-bold text-text-1 leading-tight">
                            {transfer.requestedQuantity}
                        </p>
                    </div>
                    {transfer.approvedQuantity != null && (
                        <div className="text-center px-4 py-2 rounded-xl bg-accent-soft border border-accent/20 min-w-[84px]">
                            <p className="text-[10px] uppercase tracking-wide text-accent font-semibold">
                                Approved
                            </p>
                            <p className="text-lg font-bold text-text-1 leading-tight">
                                {transfer.approvedQuantity}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
