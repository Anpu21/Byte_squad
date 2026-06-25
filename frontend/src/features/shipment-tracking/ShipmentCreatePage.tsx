import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuPackagePlus as PackagePlus } from 'react-icons/lu';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { TransferStatus, UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { shipmentsService } from '@/services/shipments.service';
import type { IStockTransferRequest } from '@/types';

function routeKey(line: IStockTransferRequest): string {
    return `${line.sourceBranchId}->${line.destinationBranchId}`;
}

function describeError(err: unknown): string {
    if (
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === 'string'
    ) {
        return err.response.data.message;
    }
    return 'Could not create shipment';
}

/**
 * Bundle approved transfer lines into a courier shipment. Lines are grouped by
 * route; once you pick a line, only same-route lines stay selectable (the
 * backend requires a single source + destination per shipment).
 */
export function ShipmentCreatePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === UserRole.ADMIN;

    const { data, isLoading } = useQuery({
        queryKey: ['shipments', 'approved-lines', user?.role ?? 'none'],
        queryFn: () =>
            isAdmin
                ? stockTransfersService.listAll({
                      status: TransferStatus.APPROVED,
                      limit: 100,
                  })
                : stockTransfersService.listIncoming({
                      status: TransferStatus.APPROVED,
                      limit: 100,
                  }),
    });

    const lines = useMemo(
        () =>
            (data?.items ?? []).filter(
                (l) =>
                    l.status === TransferStatus.APPROVED &&
                    l.sourceBranchId &&
                    !l.shipmentId,
            ),
        [data],
    );

    const groups = useMemo(() => {
        const map = new Map<string, IStockTransferRequest[]>();
        for (const line of lines) {
            const key = routeKey(line);
            const arr = map.get(key) ?? [];
            arr.push(line);
            map.set(key, arr);
        }
        return [...map.entries()];
    }, [lines]);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [creating, setCreating] = useState(false);

    const selectedRoute = useMemo(() => {
        const first = lines.find((l) => selected.has(l.id));
        return first ? routeKey(first) : null;
    }, [selected, lines]);

    const toggle = (line: IStockTransferRequest) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(line.id)) next.delete(line.id);
            else next.add(line.id);
            return next;
        });
    };

    const create = async () => {
        if (selected.size === 0) return;
        setCreating(true);
        try {
            const shipment = await shipmentsService.create({
                lineIds: [...selected],
            });
            toast.success('Shipment created');
            navigate(FRONTEND_ROUTES.SHIPMENT_DETAIL.replace(':id', shipment.id));
        } catch (e) {
            toast.error(describeError(e));
            setCreating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1 mb-4"
            >
                <ArrowLeft size={15} /> Back
            </button>
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text-1 mb-1">
                New shipment
            </h1>
            <p className="text-xs text-text-2 mb-5">
                Pick approved transfer lines that share a route to bundle into one
                courier parcel.
            </p>

            {isLoading ? (
                <div className="flex items-center justify-center h-[40vh]">
                    <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                </div>
            ) : groups.length === 0 ? (
                <div className="border border-border rounded-xl bg-surface p-10 text-center text-sm text-text-3">
                    No approved transfer lines are waiting to ship.
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map(([key, groupLines]) => {
                        const routeDisabled =
                            selectedRoute !== null && selectedRoute !== key;
                        const first = groupLines[0];
                        return (
                            <div
                                key={key}
                                className={`border border-border rounded-xl bg-surface overflow-hidden ${
                                    routeDisabled ? 'opacity-50' : ''
                                }`}
                            >
                                <div className="px-5 py-3 border-b border-border flex items-center gap-2 text-sm font-medium text-text-1">
                                    {first.sourceBranch?.name ?? 'Source'}
                                    <ArrowRight size={13} className="text-text-3" />
                                    {first.destinationBranch?.name ?? 'Destination'}
                                </div>
                                <ul>
                                    {groupLines.map((line) => (
                                        <li
                                            key={line.id}
                                            className="border-t border-border first:border-t-0"
                                        >
                                            <label className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-surface-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(line.id)}
                                                    disabled={routeDisabled}
                                                    onChange={() => toggle(line)}
                                                    className="h-4 w-4"
                                                />
                                                <span className="flex-1 text-sm text-text-1">
                                                    {line.product?.name ?? line.productId}
                                                </span>
                                                <span className="text-sm tabular-nums text-text-2">
                                                    {line.approvedQuantity ??
                                                        line.requestedQuantity}
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}

                    <div className="flex justify-end">
                        <Button
                            disabled={selected.size === 0 || creating}
                            onClick={create}
                        >
                            <PackagePlus size={16} /> Create shipment
                            {selected.size > 0 ? ` (${selected.size})` : ''}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
