import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IStockTransferRequest } from '@/types';
import { formatTimeAgo } from '../lib/format-time-ago';

interface TransferBoardCardProps {
    transfer: IStockTransferRequest;
}

export function TransferBoardCard({ transfer }: TransferBoardCardProps) {
    const qty = transfer.approvedQuantity ?? transfer.requestedQuantity;
    const fromName = transfer.sourceBranch?.name ?? '—';
    const toName = transfer.destinationBranch.name;
    const requesterName = transfer.requestedBy
        ? `${transfer.requestedBy.firstName} ${transfer.requestedBy.lastName}`
        : 'Unknown';
    const requesterFirstName =
        transfer.requestedBy?.firstName ?? 'Unknown';
    const detailPath = FRONTEND_ROUTES.TRANSFER_DETAIL.replace(
        ':id',
        transfer.id,
    );

    return (
        <Link
            to={detailPath}
            title={transfer.product?.name}
            className="block bg-surface border border-border rounded-md p-3 hover:border-border-strong hover:shadow-md-token hover:-translate-y-[1px] transition-all focus:outline-none focus:ring-[3px] focus:ring-primary/30"
        >
            <p className="text-[13px] font-semibold text-text-1 leading-tight truncate">
                {transfer.product?.name ?? 'Untitled product'}
            </p>
            <p className="text-[11px] text-text-3 mono mt-1 flex items-center gap-1.5 truncate">
                <span className="tabular-nums">{qty} units</span>
                <span className="text-text-3">·</span>
                <span className="truncate">{fromName}</span>
                <ArrowRight
                    size={10}
                    strokeWidth={2}
                    className="flex-shrink-0 text-text-3"
                />
                <span className="truncate">{toName}</span>
            </p>
            <div className="flex items-center justify-between gap-2 mt-3">
                <div
                    className="flex items-center gap-1.5 min-w-0"
                    title={requesterName}
                >
                    <Avatar name={requesterName} size={18} />
                    <span className="text-[11px] text-text-2 truncate">
                        {requesterFirstName}
                    </span>
                    <span className="text-[11px] text-text-3">·</span>
                    <span className="text-[11px] text-text-3">
                        {formatTimeAgo(transfer.updatedAt)}
                    </span>
                </div>
                <TransferStatusPill status={transfer.status} />
            </div>
        </Link>
    );
}
