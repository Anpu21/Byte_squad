import { useNavigate } from 'react-router-dom';
import { TransferStatus } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import type { IStockTransferRequest } from '@/types';
import { formatTimeAgo } from '../lib/format-time-ago';

interface AdminTransferRowProps {
    transfer: IStockTransferRequest;
}

export function AdminTransferRow({ transfer }: AdminTransferRowProps) {
    const navigate = useNavigate();
    const detailUrl = FRONTEND_ROUTES.TRANSFER_DETAIL.replace(
        ':id',
        transfer.id,
    );
    const qty = transfer.approvedQuantity ?? transfer.requestedQuantity;
    const isPending = transfer.status === TransferStatus.PENDING;

    return (
        <tr
            className="border-b border-border hover:bg-surface-2 transition-colors group cursor-pointer"
            onClick={() => navigate(detailUrl)}
        >
            <td className="px-6 py-4">
                <span className="text-text-1 font-medium">
                    {transfer.product.name}
                </span>
            </td>
            <td className="px-6 py-4 text-text-1">
                {transfer.destinationBranch.name}
            </td>
            <td className="px-6 py-4 text-text-2">
                {transfer.sourceBranch?.name ?? '—'}
            </td>
            <td className="px-6 py-4 text-right tabular-nums text-text-1 font-medium">
                {qty}
            </td>
            <td className="px-6 py-4">
                <TransferStatusPill status={transfer.status} />
            </td>
            <td className="px-6 py-4 text-text-3">
                {formatTimeAgo(transfer.createdAt)}
            </td>
            <td className="px-6 py-4 text-right">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(detailUrl);
                    }}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                        isPending
                            ? 'bg-primary text-text-inv hover:bg-primary-hover'
                            : 'border border-border text-text-1 hover:bg-surface-2'
                    }`}
                >
                    {isPending ? 'Review →' : 'View'}
                </button>
            </td>
        </tr>
    );
}
