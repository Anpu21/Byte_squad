import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customerRequestsService } from '@/services/customer-requests.service';
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
    completed: 'Picked up',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

const STATUS_TONE: Record<CustomerRequestStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    expired: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export default function MyRequestsPage() {
    const queryClient = useQueryClient();
    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['my-customer-requests'],
        queryFn: customerRequestsService.listMine,
    });

    const onCancel = async (id: string) => {
        if (!window.confirm('Cancel this request?')) return;
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
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    My pickup requests
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Past and pending requests. Click any row to view its QR.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-24 text-slate-500 text-sm">
                    No requests yet.
                </div>
            ) : (
                <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#111] border-b border-white/10">
                            <tr className="text-[11px] uppercase tracking-widest text-slate-500">
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
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            to={`/shop/requests/${req.requestCode}`}
                                            className="text-emerald-400 hover:underline font-mono text-xs"
                                        >
                                            {req.requestCode}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-[13px]">
                                        {formatDate(req.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">
                                        {req.branch?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">
                                        {req.items.length}
                                    </td>
                                    <td className="px-4 py-3 text-white font-medium text-right">
                                        {formatCurrency(Number(req.estimatedTotal))}
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
                                                className="text-[11px] text-rose-400 hover:underline"
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
            )}
        </div>
    );
}
