import { Inbox } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { CustomerRequestStatus, ICustomerRequest } from '@/types';
import { CustomerRequestsFilter } from './CustomerRequestsFilter';
import { CustomerRequestRow } from './CustomerRequestRow';

interface CustomerRequestsTableProps {
    requests: ICustomerRequest[];
    isLoading: boolean;
    hasFilters: boolean;
    isAdmin: boolean;
    actionPending: boolean;
    search: string;
    setSearch: (v: string) => void;
    statusFilter: CustomerRequestStatus | '';
    setStatusFilter: (v: CustomerRequestStatus | '') => void;
    canReview: (branchId: string) => boolean;
    onView: (id: string) => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}

export function CustomerRequestsTable({
    requests,
    isLoading,
    hasFilters,
    isAdmin,
    actionPending,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    canReview,
    onView,
    onAccept,
    onReject,
}: CustomerRequestsTableProps) {
    const showBranchCol = isAdmin;

    return (
        <Card>
            <CardHeader>
                <div className="min-w-0">
                    <CardTitle>All requests</CardTitle>
                    <p className="text-xs text-text-2 mt-0.5">
                        {requests.length}{' '}
                        {requests.length === 1 ? 'request' : 'requests'}
                        {isAdmin ? ' across all branches' : ' at your branch'}
                    </p>
                </div>
            </CardHeader>

            <CustomerRequestsFilter
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />

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
                                {requests.map((req) => (
                                    <CustomerRequestRow
                                        key={req.id}
                                        request={req}
                                        showBranchCol={showBranchCol}
                                        canReview={canReview(req.branchId)}
                                        actionPending={actionPending}
                                        onView={onView}
                                        onAccept={onAccept}
                                        onReject={onReject}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
