import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import Button from '@/components/ui/Button';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IStockTransferRequest } from '@/types';
import { boardActionsForStatus } from '../lib/board-card-actions';
import { useBoardAction } from '../context/board-action-context';

interface TransferBoardTableProps {
    rows: IStockTransferRequest[];
    isLoading: boolean;
}

/**
 * The transfer action list: each row shows product, route, qty + status and
 * the explicit actions allowed in that status (Approve/Reject/Ship/Receive/
 * Cancel). Actions reuse the shared modal flow via the board action context.
 */
export function TransferBoardTable({ rows, isLoading }: TransferBoardTableProps) {
    const navigate = useNavigate();
    const openAction = useBoardAction();

    if (!isLoading && rows.length === 0) {
        return (
            <div className="bg-surface border border-border rounded-xl py-16 text-center">
                <p className="text-sm font-medium text-text-2">
                    Nothing here right now
                </p>
                <p className="text-xs text-text-3 mt-1">
                    Transfers in this stage will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-3 bg-surface-2">
                            <th className="px-5 py-3 font-semibold">Product</th>
                            <th className="px-5 py-3 font-semibold">Route</th>
                            <th className="px-5 py-3 font-semibold text-right">
                                Qty
                            </th>
                            <th className="px-5 py-3 font-semibold">Status</th>
                            <th className="px-5 py-3 font-semibold text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-border">
                                    {[...Array(5)].map((__, j) => (
                                        <td key={j} className="px-5 py-3.5">
                                            <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            rows.map((t) => {
                                const qty =
                                    t.approvedQuantity ?? t.requestedQuantity;
                                const actions = boardActionsForStatus(t.status);
                                return (
                                    <tr
                                        key={t.id}
                                        className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors cursor-pointer"
                                        onClick={() =>
                                            navigate(
                                                FRONTEND_ROUTES.TRANSFER_DETAIL.replace(
                                                    ':id',
                                                    t.id,
                                                ),
                                            )
                                        }
                                    >
                                        <td className="px-5 py-3.5 text-text-1 font-medium">
                                            {t.product?.name ?? '—'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-text-2">
                                                {t.sourceBranch?.name ?? (
                                                    <span className="text-text-3 italic">
                                                        No source
                                                    </span>
                                                )}
                                                <ArrowRight
                                                    size={13}
                                                    className="text-text-3 flex-shrink-0"
                                                />
                                                <span className="text-text-1 font-medium">
                                                    {t.destinationBranch
                                                        ?.name ?? '—'}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right tabular-nums text-text-1 font-medium">
                                            {qty}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <TransferStatusPill
                                                status={t.status}
                                            />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div
                                                className="flex items-center justify-end gap-1.5"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {actions.length > 0 &&
                                                openAction ? (
                                                    actions.map((a) => (
                                                        <Button
                                                            key={a.action}
                                                            size="sm"
                                                            variant={a.variant}
                                                            onClick={() =>
                                                                openAction(
                                                                    t,
                                                                    a.action,
                                                                )
                                                            }
                                                        >
                                                            {a.label}
                                                        </Button>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-text-3">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
