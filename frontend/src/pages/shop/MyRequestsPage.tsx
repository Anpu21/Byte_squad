import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ScrollText } from 'lucide-react';
import { customerRequestsService } from '@/services/customer-requests.service';
import { useConfirm } from '@/hooks/useConfirm';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { CustomerRequestStatus } from '@/types';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

const STATUS_LABEL: Record<CustomerRequestStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    completed: 'Picked up',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

const STATUS_TONE: Record<CustomerRequestStatus, string> = {
    pending: 'bg-warning-soft text-warning border-warning/40',
    accepted: 'bg-primary-soft text-primary-soft-text border-primary/40',
    completed: 'bg-accent-soft text-accent-text border-accent/40',
    rejected: 'bg-danger-soft text-danger border-danger/40',
    cancelled: 'bg-surface-2 text-text-2 border-border',
    expired: 'bg-surface-2 text-text-2 border-border',
};

export default function MyRequestsPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['my-customer-requests'],
        queryFn: customerRequestsService.listMine,
    });

    const onCancel = async (id: string) => {
        const ok = await confirm({
            title: 'Cancel this pickup request?',
            body: "The branch won't fulfill it. You can place a new request any time.",
            confirmLabel: 'Cancel request',
            cancelLabel: 'Keep it',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await customerRequestsService.cancelMine(id);
            toast.success('Request cancelled');
            await queryClient.invalidateQueries({
                queryKey: ['my-customer-requests'],
            });
        } catch {
            toast.error('Could not cancel');
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    My pickup requests
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    Past and pending requests. Click any row to view its QR.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
                        <ScrollText size={22} className="text-text-2" />
                    </div>
                    <p className="text-sm font-semibold text-text-1">
                        No requests yet
                    </p>
                    <p className="text-xs text-text-3 mt-1">
                        Your pickup requests will appear here once you check out.
                    </p>
                </div>
            ) : (
                <>
                    <div className="hidden sm:block bg-surface border border-border rounded-md overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-surface border-b border-border">
                                <tr className="text-[11px] uppercase tracking-widest text-text-3">
                                    <th className="px-4 py-3 font-semibold">Code</th>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                    <th className="px-4 py-3 font-semibold">Branch</th>
                                    <th className="px-4 py-3 font-semibold">Items</th>
                                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {requests.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="border-b border-border hover:bg-surface-2 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                to={FRONTEND_ROUTES.SHOP_REQUEST_CONFIRMATION.replace(
                                                    ':code',
                                                    req.requestCode,
                                                )}
                                                className="text-accent-text hover:underline font-mono text-xs"
                                            >
                                                {req.requestCode}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-text-2 text-[13px]">
                                            {formatDate(req.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-text-1">
                                            {req.branch?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-text-2">
                                            {req.items.length}
                                        </td>
                                        <td className="px-4 py-3 text-text-1 font-medium text-right">
                                            {formatCurrency(req.estimatedTotal)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_TONE[req.status]}`}
                                            >
                                                {STATUS_LABEL[req.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {req.status === 'pending' && (
                                                <button
                                                    type="button"
                                                    onClick={() => onCancel(req.id)}
                                                    className="text-[11px] text-danger hover:underline"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="sm:hidden flex flex-col gap-3">
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className="bg-surface border border-border rounded-md p-4"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <Link
                                        to={FRONTEND_ROUTES.SHOP_REQUEST_CONFIRMATION.replace(
                                            ':code',
                                            req.requestCode,
                                        )}
                                        className="text-accent-text hover:underline font-mono text-sm font-semibold"
                                    >
                                        {req.requestCode}
                                    </Link>
                                    <span
                                        className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_TONE[req.status]}`}
                                    >
                                        {STATUS_LABEL[req.status]}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-text-3 uppercase tracking-widest text-[10px]">
                                            Date
                                        </p>
                                        <p className="text-text-1 mt-0.5">
                                            {formatDate(req.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-text-3 uppercase tracking-widest text-[10px]">
                                            Branch
                                        </p>
                                        <p className="text-text-1 mt-0.5 truncate">
                                            {req.branch?.name ?? '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-text-3 uppercase tracking-widest text-[10px]">
                                            Items
                                        </p>
                                        <p className="text-text-1 mt-0.5">
                                            {req.items.length}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-text-3 uppercase tracking-widest text-[10px]">
                                            Total
                                        </p>
                                        <p className="text-text-1 mt-0.5 font-medium">
                                            {formatCurrency(req.estimatedTotal)}
                                        </p>
                                    </div>
                                </div>
                                {req.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => onCancel(req.id)}
                                        className="mt-3 text-[11px] text-danger hover:underline"
                                    >
                                        Cancel request
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
