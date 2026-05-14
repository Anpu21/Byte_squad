import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { TransferBoardGroup } from '../types/transfer-board-group.type';
import { formatTimeAgo } from '../lib/format-time-ago';
import { TransferBoardSingleLineCard } from './TransferBoardSingleLineCard';

interface TransferBoardCardProps {
    group: TransferBoardGroup;
}

const LINE_PREVIEW_LIMIT = 3;

function transferQty(transfer: TransferBoardGroup['primary']): number {
    return transfer.approvedQuantity ?? transfer.requestedQuantity;
}

function detailPathFor(id: string): string {
    return FRONTEND_ROUTES.TRANSFER_DETAIL.replace(':id', id);
}

export function TransferBoardCard({ group }: TransferBoardCardProps) {
    const { transfers, primary } = group;
    const isBatch = transfers.length > 1;

    if (!isBatch) {
        return <TransferBoardSingleLineCard transfer={primary} />;
    }

    const fromName = primary.sourceBranch?.name ?? '—';
    const toName = primary.destinationBranch.name;
    const requesterName = primary.requestedBy
        ? `${primary.requestedBy.firstName} ${primary.requestedBy.lastName}`
        : 'Unknown';
    const requesterFirstName = primary.requestedBy?.firstName ?? 'Unknown';

    const totalUnits = transfers.reduce(
        (sum, t) => sum + transferQty(t),
        0,
    );
    const previewLines = transfers.slice(0, LINE_PREVIEW_LIMIT);
    const overflowCount = transfers.length - previewLines.length;

    return (
        <div
            aria-label={`Batch of ${transfers.length} products`}
            className="bg-surface border border-border rounded-md p-3 hover:border-border-strong hover:shadow-md-token transition-all"
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-text-1 leading-tight flex items-center gap-1.5 min-w-0">
                    <Package
                        size={12}
                        strokeWidth={2.25}
                        className="flex-shrink-0 text-text-3"
                        aria-hidden
                    />
                    <span className="truncate">
                        {transfers.length} products
                    </span>
                    <span className="text-text-3 font-normal">·</span>
                    <span className="text-text-2 font-medium tabular-nums">
                        {totalUnits} units
                    </span>
                </p>
                <TransferStatusPill status={primary.status} />
            </div>

            <p className="text-[11px] text-text-3 mono mt-1.5 flex items-center gap-1.5 truncate">
                <span className="truncate">{fromName}</span>
                <ArrowRight
                    size={10}
                    strokeWidth={2}
                    className="flex-shrink-0 text-text-3"
                />
                <span className="truncate">{toName}</span>
            </p>

            <ul className="mt-2.5 space-y-1 border-t border-border pt-2">
                {previewLines.map((line) => (
                    <li
                        key={line.id}
                        className="flex items-center gap-2 text-[12px] min-w-0"
                    >
                        <span className="flex-1 truncate text-text-1">
                            {line.product?.name ?? 'Untitled product'}
                        </span>
                        <span className="tabular-nums mono text-text-2 flex-shrink-0">
                            ×{transferQty(line)}
                        </span>
                        <Link
                            to={detailPathFor(line.id)}
                            className="text-[11px] text-primary hover:underline flex-shrink-0 focus:outline-none focus:ring-[2px] focus:ring-primary/30 rounded"
                            aria-label={`View ${line.product?.name ?? 'transfer'}`}
                        >
                            view
                        </Link>
                    </li>
                ))}
                {overflowCount > 0 && (
                    <li className="text-[11px] text-text-3 pl-0.5">
                        +{overflowCount} more
                    </li>
                )}
            </ul>

            <div
                className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border min-w-0"
                title={requesterName}
            >
                <Avatar name={requesterName} size={18} />
                <span className="text-[11px] text-text-2 truncate">
                    {requesterFirstName}
                </span>
                <span className="text-[11px] text-text-3">·</span>
                <span className="text-[11px] text-text-3">
                    {formatTimeAgo(primary.updatedAt)}
                </span>
            </div>
        </div>
    );
}
