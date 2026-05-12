import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    AlertTriangle,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock,
    Eye,
    Inbox,
    ScanLine,
    Search,
    X,
} from 'lucide-react';
import { customerRequestsService } from '@/services/customer-requests.service';
import { getNotificationSocket } from '@/services/socket.service';
import { profileService } from '@/services/profile.service';
import { useAuth } from '@/hooks/useAuth';
import { useConfirm } from '@/hooks/useConfirm';
import { UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { queryKeys } from '@/lib/queryKeys';
import type { CustomerRequestStatus } from '@/types';
import KpiCard from '@/components/ui/KpiCard';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusPill from '@/components/ui/StatusPill';
import EmptyState from '@/components/ui/EmptyState';
import { StaffRequestDetailsModal } from '@/components/requests/StaffRequestDetailsModal';

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
    'accepted',
    'completed',
    'rejected',
    'cancelled',
    'expired',
];

const STATUS_LABEL: Record<CustomerRequestStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

function isToday(date: Date): boolean {
    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
}

function isThisMonth(date: Date): boolean {
    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
    );
}

const inputClass =
    'w-full h-10 px-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors placeholder:text-text-3';

export default function CustomerRequestsPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState<
        CustomerRequestStatus | ''
    >('');
    const [search, setSearch] = useState('');

    const { data: requests = [], isLoading } = useQuery({
        queryKey: queryKeys.customerRequests.list({ statusFilter, search }),
        queryFn: () =>
            customerRequestsService.listForStaff({
                status: statusFilter || undefined,
                q: search.trim() || undefined,
            }),
        refetchInterval: 30000,
    });

    // Diagnostic: which branch is the backend filtering to? Pulled from the
    // staff member's profile so a wrong branch assignment is visible at a
    // glance (vs the silent "0 rows" symptom that prompted this fix).
    const { data: profile } = useQuery({
        queryKey: queryKeys.profile.self(),
        queryFn: profileService.getProfile,
        enabled: user?.role !== UserRole.ADMIN,
    });

    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
        null,
    );
    const [actionPending, setActionPending] = useState(false);
    const selectedRequest =
        requests.find((r) => r.id === selectedRequestId) ?? null;

    // Live refetch: when a customer creates a request at our branch (or any
    // branch, for admin), invalidate the list so the new row appears within
    // a second instead of waiting for the 30 s poll.
    useEffect(() => {
        const socket = getNotificationSocket();
        const onCreated = (payload: { branchId: string }) => {
            if (
                user?.role === UserRole.ADMIN ||
                payload.branchId === user?.branchId
            ) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.customerRequests.all(),
                });
            }
        };
        socket.on('customer-request:created', onCreated);
        return () => {
            socket.off('customer-request:created', onCreated);
        };
    }, [user?.role, user?.branchId, queryClient]);

    const onAccept = async (id: string) => {
        setActionPending(true);
        try {
            await customerRequestsService.acceptByStaff(id);
            toast.success('Request accepted');
            await queryClient.invalidateQueries({
                queryKey: queryKeys.customerRequests.all(),
            });
            setSelectedRequestId(null);
        } catch {
            toast.error('Could not accept');
        } finally {
            setActionPending(false);
        }
    };

    const onReject = async (id: string) => {
        const ok = await confirm({
            title: 'Reject this request?',
            body: 'The customer will be notified that their pickup request was declined.',
            confirmLabel: 'Reject request',
            tone: 'danger',
        });
        if (!ok) return;
        setActionPending(true);
        try {
            await customerRequestsService.rejectByStaff(id);
            toast.success('Request rejected');
            await queryClient.invalidateQueries({
                queryKey: queryKeys.customerRequests.all(),
            });
            setSelectedRequestId(null);
        } catch {
            toast.error('Could not reject');
        } finally {
            setActionPending(false);
        }
    };

    const canReview = (branchId: string) =>
        user?.role === UserRole.ADMIN ||
        (user?.role === UserRole.MANAGER && user.branchId === branchId);

    const isAdmin = user?.role === UserRole.ADMIN;
    const isCashier = user?.role === UserRole.CASHIER;
    const subtitle = isAdmin
        ? 'Pickup requests across all branches. Auto-refreshes every 30 seconds.'
        : 'Pickup requests at your branch. Auto-refreshes every 30 seconds.';
    const filterBranchName = profile?.branch?.name ?? null;
    const filterBranchShortId = user?.branchId
        ? user.branchId.slice(0, 8)
        : null;

    const kpis = useMemo(() => {
        let pending = 0;
        let completedToday = 0;
        let monthTotal = 0;
        for (const r of requests) {
            const created = new Date(r.createdAt);
            if (r.status === 'pending') pending++;
            if (r.status === 'completed' && isToday(created)) completedToday++;
            if (isThisMonth(created)) monthTotal++;
        }
        return { pending, completedToday, monthTotal };
    }, [requests]);

    const showBranchCol = isAdmin;
    const hasFilters = statusFilter !== '' || search.trim() !== '';
    const needsBranchAssignment =
        user?.role !== UserRole.ADMIN && !user?.branchId;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-6">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Customer Requests
                    </h1>
                    <p className="text-sm text-text-2 mt-1">{subtitle}</p>
                    {!isAdmin && user?.branchId && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-text-2 bg-surface-2 border border-border rounded-full px-2.5 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            Showing for:{' '}
                            <span className="text-text-1 font-semibold">
                                {filterBranchName ?? 'your branch'}
                            </span>
                            {filterBranchShortId && (
                                <span className="text-text-3 mono">
                                    · {filterBranchShortId}…
                                </span>
                            )}
                        </p>
                    )}
                </div>
                {isCashier && (
                    <Link to={FRONTEND_ROUTES.SCAN_REQUEST}>
                        <Button>
                            <ScanLine size={14} />
                            Scan Pickup
                        </Button>
                    </Link>
                )}
            </div>

            {needsBranchAssignment && (
                <div
                    role="alert"
                    className="mb-4 p-3 rounded-md bg-warning-soft border border-warning/40 text-text-1 text-sm flex items-start gap-2"
                >
                    <AlertTriangle
                        size={16}
                        className="text-warning flex-shrink-0 mt-0.5"
                    />
                    <div>
                        <p className="font-semibold">
                            Your account isn't assigned to a branch yet.
                        </p>
                        <p className="text-xs text-text-2 mt-0.5">
                            Pickup requests are filtered to your branch — please
                            contact an admin to assign one before requests will
                            appear here.
                        </p>
                    </div>
                </div>
            )}

            {/* KPI strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <KpiCard
                    label="Pending"
                    value={kpis.pending}
                    delta={
                        kpis.pending > 0
                            ? `${kpis.pending} need attention`
                            : 'All clear'
                    }
                    deltaPositive={kpis.pending === 0}
                    sparkData={[2, 3, 2, 4, 3, 5, 4]}
                    sparkColor="var(--warning)"
                    icon={<Clock size={14} />}
                />
                <KpiCard
                    label="Completed today"
                    value={kpis.completedToday}
                    delta="Pickups fulfilled"
                    sparkData={[1, 2, 3, 4, 5, 6, 7]}
                    sparkColor="var(--accent)"
                    icon={<CheckCircle2 size={14} />}
                />
                <KpiCard
                    label="This month"
                    value={kpis.monthTotal}
                    delta="Total requests"
                    sparkData={[3, 5, 4, 6, 7, 8, 9]}
                    icon={<CalendarDays size={14} />}
                />
            </div>

            {/* Table card */}
            <Card>
                <CardHeader>
                    <div className="min-w-0">
                        <CardTitle>All requests</CardTitle>
                        <p className="text-xs text-text-2 mt-0.5">
                            {requests.length}{' '}
                            {requests.length === 1 ? 'request' : 'requests'}
                            {isAdmin
                                ? ' across all branches'
                                : ' at your branch'}
                        </p>
                    </div>
                </CardHeader>

                {/* Filter row */}
                <div className="px-5 py-4 border-b border-border bg-surface-2/40 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search code or guest name…"
                            className={`${inputClass} pl-9`}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as CustomerRequestStatus | '',
                            )
                        }
                        className={`${inputClass} sm:w-44`}
                    >
                        <option value="">All statuses</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                            </option>
                        ))}
                    </select>
                </div>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : requests.length === 0 ? (
                        <EmptyState
                            icon={<Inbox size={20} />}
                            title={
                                hasFilters
                                    ? 'No requests match your filters'
                                    : 'No requests yet'
                            }
                            description={
                                hasFilters
                                    ? 'Try clearing the search or selecting a different status.'
                                    : 'Pickup requests from customers will appear here.'
                            }
                        />
                    ) : (
                        <div className="overflow-auto max-h-[640px]">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-surface-2 z-10">
                                    <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 border-b border-border">
                                        <th className="px-5 py-2.5 text-left font-semibold">
                                            Code
                                        </th>
                                        <th className="px-5 py-2.5 text-left font-semibold">
                                            Date / Time
                                        </th>
                                        {showBranchCol && (
                                            <th className="px-5 py-2.5 text-left font-semibold">
                                                Branch
                                            </th>
                                        )}
                                        <th className="px-5 py-2.5 text-left font-semibold">
                                            Customer
                                        </th>
                                        <th className="px-5 py-2.5 text-right font-semibold">
                                            Items
                                        </th>
                                        <th className="px-5 py-2.5 text-right font-semibold">
                                            Total
                                        </th>
                                        <th className="px-5 py-2.5 text-left font-semibold">
                                            Status
                                        </th>
                                        <th className="px-5 py-2.5 w-44" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => {
                                        const customerName = req.user
                                            ? `${req.user.firstName} ${req.user.lastName}`
                                            : (req.guestName ?? 'Guest');
                                        return (
                                            <tr
                                                key={req.id}
                                                className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                                            >
                                                <td className="px-5 py-3 mono text-xs text-text-1">
                                                    {req.requestCode}
                                                </td>
                                                <td className="px-5 py-3 mono text-xs text-text-2">
                                                    {formatDateTime(
                                                        req.createdAt,
                                                    )}
                                                </td>
                                                {showBranchCol && (
                                                    <td className="px-5 py-3 text-[13px] text-text-1">
                                                        {req.branch?.name ?? '—'}
                                                    </td>
                                                )}
                                                <td className="px-5 py-3 text-[13px] text-text-1">
                                                    {customerName}
                                                </td>
                                                <td className="px-5 py-3 mono text-[13px] text-text-2 text-right">
                                                    {req.items.length}
                                                </td>
                                                <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                                    {formatCurrency(
                                                        Number(
                                                            req.estimatedTotal,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <StatusPill
                                                        status={req.status}
                                                    />
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedRequestId(
                                                                    req.id,
                                                                )
                                                            }
                                                            aria-label={`View pickup request ${req.requestCode}`}
                                                            className="inline-flex items-center gap-1 text-[12px] font-medium text-text-2 hover:text-text-1 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 rounded px-2 py-1"
                                                        >
                                                            <Eye size={12} />
                                                            View
                                                        </button>
                                                        {req.status ===
                                                            'pending' &&
                                                            canReview(
                                                                req.branchId,
                                                            ) && (
                                                                <>
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            onAccept(
                                                                                req.id,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            actionPending
                                                                        }
                                                                    >
                                                                        <Check
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        Accept
                                                                    </Button>
                                                                    <Button
                                                                        variant="danger"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            onReject(
                                                                                req.id,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            actionPending
                                                                        }
                                                                    >
                                                                        <X
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <StaffRequestDetailsModal
                isOpen={!!selectedRequestId}
                onClose={() => setSelectedRequestId(null)}
                request={selectedRequest}
                canReview={
                    selectedRequest ? canReview(selectedRequest.branchId) : false
                }
                onAccept={onAccept}
                onReject={onReject}
                actionPending={actionPending}
            />
        </div>
    );
}
