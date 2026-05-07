import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, ScanLine } from 'lucide-react';
import { customerRequestsService } from '@/services/customer-requests.service';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { CustomerRequestStatus } from '@/types';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const STATUSES: CustomerRequestStatus[] = [
    'pending',
    'completed',
    'rejected',
    'cancelled',
    'expired',
];

const STATUS_TONE: Record<CustomerRequestStatus, string> = {
    pending: 'bg-warning-soft text-warning border-warning/40',
    completed: 'bg-accent-soft text-accent-text border-accent/40',
    rejected: 'bg-danger-soft text-danger border-danger/40',
    cancelled: 'bg-slate-500/10 text-text-2 border-slate-500/30',
    expired: 'bg-slate-500/10 text-text-2 border-slate-500/30',
};

export default function CustomerRequestsPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState<
        CustomerRequestStatus | ''
    >('');
    const [search, setSearch] = useState('');

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['customer-requests', { statusFilter, search }],
        queryFn: () =>
            customerRequestsService.listForStaff({
                status: statusFilter || undefined,
                q: search.trim() || undefined,
            }),
        refetchInterval: 30000,
    });

    const onReject = async (id: string) => {
        if (!window.confirm('Reject this request?')) return;
        try {
            await customerRequestsService.rejectByStaff(id);
            toast.success('Request rejected');
            await queryClient.invalidateQueries({
                queryKey: ['customer-requests'],
            });
        } catch {
            toast.error('Could not reject');
        }
    };

    const canReject = (branchId: string) =>
        user?.role === UserRole.ADMIN ||
        (user?.role === UserRole.MANAGER && user.branchId === branchId);

    const isAdmin = user?.role === UserRole.ADMIN;
    const subtitle = isAdmin
        ? 'Pickup requests across all branches. Auto-refreshes every 30 seconds.'
        : 'Pickup requests at your branch. Auto-refreshes every 30 seconds.';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Customer Requests
                    </h1>
                    <p className="text-sm text-text-2 mt-1">{subtitle}</p>
                </div>
                {user?.role === UserRole.CASHIER && (
                    <Link
                        to={FRONTEND_ROUTES.SCAN_REQUEST}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-primary text-black rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <ScanLine size={14} /> Scan Pickup
                    </Link>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search code or guest name…"
                        className="w-full bg-[#111] border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-1 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value as CustomerRequestStatus | '')
                    }
                    className="bg-[#111] border border-border rounded-lg px-3 py-2 text-sm text-text-1 focus:outline-none focus:border-emerald-500"
                >
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            <div className="bg-[#111] border border-border rounded-md overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-2 border-border-strong border-t-white rounded-full animate-spin" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="px-6 py-16 text-center text-text-3 text-sm">
                        No requests match your filters.
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#111] border-b border-border">
                                <tr className="text-[11px] uppercase tracking-widest text-text-3">
                                    <th className="px-4 py-3 font-semibold">Code</th>
                                    <th className="px-4 py-3 font-semibold">Date / Time</th>
                                    <th className="px-4 py-3 font-semibold">Branch</th>
                                    <th className="px-4 py-3 font-semibold">Customer</th>
                                    <th className="px-4 py-3 font-semibold">Items</th>
                                    <th className="px-4 py-3 font-semibold text-right">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {requests.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="border-b border-border hover:bg-surface-2 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-accent-text font-mono text-xs">
                                            {req.requestCode}
                                        </td>
                                        <td className="px-4 py-3 text-text-2 text-[13px]">
                                            {formatDateTime(req.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-text-1">
                                            {req.branch?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-text-2">
                                            {req.customer
                                                ? `${req.customer.firstName} ${req.customer.lastName}`
                                                : (req.guestName ?? 'Guest')}
                                        </td>
                                        <td className="px-4 py-3 text-text-2">
                                            {req.items.length}
                                        </td>
                                        <td className="px-4 py-3 text-text-1 font-medium text-right">
                                            {formatCurrency(Number(req.estimatedTotal))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_TONE[req.status]}`}
                                            >
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {req.status === 'pending' &&
                                                canReject(req.branchId) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onReject(req.id)}
                                                        className="text-[11px] text-danger hover:underline"
                                                    >
                                                        Reject
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
        </div>
    );
}
