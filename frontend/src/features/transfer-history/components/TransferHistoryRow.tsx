import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import type { IStockTransferRequest } from '@/types';
import { formatDuration, formatHistoryDate, terminalAt } from '../lib/format';

interface TransferHistoryRowProps {
    item: IStockTransferRequest;
}

export function TransferHistoryRow({ item }: TransferHistoryRowProps) {
    const navigate = useNavigate();
    const closedAt = terminalAt(item);
    const requester = item.requestedBy
        ? `${item.requestedBy.firstName} ${item.requestedBy.lastName}`.trim()
        : '—';
    const qty = item.approvedQuantity ?? item.requestedQuantity;

    return (
        <tr
            className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors cursor-pointer"
            onClick={() =>
                navigate(
                    FRONTEND_ROUTES.TRANSFER_DETAIL.replace(':id', item.id),
                )
            }
        >
            <td className="px-5 py-3.5">
                <TransferStatusPill status={item.status} />
            </td>
            <td className="px-5 py-3.5 text-text-1 font-medium">
                {item.product.name}
            </td>
            <td className="px-5 py-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-text-2">
                    {item.sourceBranch?.name ?? '—'}
                    <ArrowRight
                        size={13}
                        className="text-text-3 flex-shrink-0"
                    />
                    <span className="text-text-1 font-medium">
                        {item.destinationBranch.name}
                    </span>
                </span>
            </td>
            <td className="px-5 py-3.5 text-right tabular-nums text-text-1 font-medium">
                {qty}
            </td>
            <td className="px-5 py-3.5 text-text-2">{requester}</td>
            <td className="px-5 py-3.5 text-text-3 whitespace-nowrap">
                {formatHistoryDate(closedAt)}
            </td>
            <td className="px-5 py-3.5 text-right text-text-3 tabular-nums whitespace-nowrap">
                {formatDuration(item.createdAt, closedAt)}
            </td>
        </tr>
    );
}
