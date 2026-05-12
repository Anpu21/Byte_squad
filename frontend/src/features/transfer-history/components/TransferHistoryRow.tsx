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
            className="border-b border-border hover:bg-surface-2 transition-colors group cursor-pointer"
            onClick={() =>
                navigate(
                    FRONTEND_ROUTES.TRANSFER_DETAIL.replace(':id', item.id),
                )
            }
        >
            <td className="px-6 py-4">
                <TransferStatusPill status={item.status} />
            </td>
            <td className="px-6 py-4">
                <span className="text-text-1 font-medium">
                    {item.product.name}
                </span>
            </td>
            <td className="px-6 py-4 text-text-2">
                {item.sourceBranch?.name ?? '—'}
                <span className="mx-2 text-text-3">→</span>
                <span className="text-text-1">
                    {item.destinationBranch.name}
                </span>
            </td>
            <td className="px-6 py-4 text-right tabular-nums text-text-1 font-medium">
                {qty}
            </td>
            <td className="px-6 py-4 text-text-2">{requester}</td>
            <td className="px-6 py-4 text-text-3">
                {formatHistoryDate(closedAt)}
            </td>
            <td className="px-6 py-4 text-right text-text-3 tabular-nums">
                {formatDuration(item.createdAt, closedAt)}
            </td>
        </tr>
    );
}
