import {
    LuBan as Ban,
    LuCheck as Check,
    LuEye as Eye,
    LuInbox as Inbox,
} from 'react-icons/lu';
import {
    Button,
    DataTable,
    EmptyState,
    StatusPill,
    type DataTableColumn,
} from '@/components/ui';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import type { CustomerOrderStatus, ICustomerOrder } from '@/types';
import { PaymentStatusBadge } from '@/features/my-orders/components/PaymentStatusBadge';
import { formatOrderDateTime } from '../lib/date-helpers';
import {
    STAFF_ORDER_STATUS_LABEL,
    isAwaitingCollection,
} from '../lib/order-status';
import { CustomerOrdersFilter } from './CustomerOrdersFilter';

interface CustomerOrdersTableProps {
    requests: ICustomerOrder[];
    isLoading: boolean;
    hasFilters: boolean;
    isAdmin: boolean;
    actionPending: boolean;
    search: string;
    setSearch: (v: string) => void;
    statusFilter: CustomerOrderStatus | '';
    setStatusFilter: (v: CustomerOrderStatus | '') => void;
    canManage: (branchId: string) => boolean;
    onView: (id: string) => void;
    onCollect: (order: ICustomerOrder) => void;
    onMarkNotCollected: (id: string) => void;
}

export function CustomerOrdersTable({
    requests,
    isLoading,
    hasFilters,
    isAdmin,
    actionPending,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    canManage,
    onView,
    onCollect,
    onMarkNotCollected,
}: CustomerOrdersTableProps) {
    const showBranchCol = isAdmin;

    const columns: DataTableColumn<ICustomerOrder>[] = [
        {
            key: 'code',
            header: 'Code',
            numeric: true,
            className: 'text-xs text-text-1',
            render: (req) => req.orderCode,
        },
        {
            key: 'date',
            header: 'Date / Time',
            numeric: true,
            className: 'text-xs text-text-2',
            render: (req) => formatOrderDateTime(req.createdAt),
        },
        ...(showBranchCol
            ? [
                  {
                      key: 'branch',
                      header: 'Branch',
                      render: (req: ICustomerOrder) => req.branch?.name ?? '—',
                  } satisfies DataTableColumn<ICustomerOrder>,
              ]
            : []),
        {
            key: 'customer',
            header: 'Customer',
            render: (req) =>
                req.user
                    ? `${req.user.firstName} ${req.user.lastName}`
                    : (req.guestName ?? 'Guest'),
        },
        {
            key: 'items',
            header: 'Items',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (req) => req.items.length,
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            numeric: true,
            className: 'font-semibold text-text-1',
            render: (req) => formatCurrency(Number(req.finalTotal)),
        },
        {
            key: 'status',
            header: 'Status',
            render: (req) => (
                <StatusPill
                    status={req.status}
                    label={STAFF_ORDER_STATUS_LABEL[req.status]}
                />
            ),
        },
        {
            key: 'payment',
            header: 'Payment',
            render: (req) => <PaymentStatusBadge status={req.paymentStatus} />,
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            headerClassName: 'w-44',
            render: (req) => {
                const awaiting = isAwaitingCollection(req.status);
                // Online pre-paid orders collect in one click; pay-at-pickup
                // orders take payment at the POS (onCollect routes there).
                // Online-but-unpaid orders aren't collectable yet, so no Collect
                // action is offered.
                const onlinePaid =
                    req.paymentMode === 'online' &&
                    req.paymentStatus === 'paid';
                const canCollect = onlinePaid || req.paymentMode === 'manual';

                return (
                    <div className="flex justify-end items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onView(req.id)}
                            aria-label={`View pickup order ${req.orderCode}`}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-text-2 hover:text-text-1 transition-colors focus:outline-none focus:ring-[3px] focus:ring-focus/25 rounded px-2 py-1"
                        >
                            <Eye size={12} />
                            View
                        </button>
                        {awaiting && canManage(req.branchId) && (
                            <>
                                {canCollect && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => onCollect(req)}
                                        disabled={actionPending}
                                    >
                                        <Check size={12} />
                                        Collect
                                    </Button>
                                )}
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => onMarkNotCollected(req.id)}
                                    disabled={actionPending}
                                >
                                    <Ban size={12} />
                                    Not collected
                                </Button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="min-w-0">
                    <CardTitle>All orders</CardTitle>
                    <p className="text-xs text-text-2 mt-0.5">
                        {requests.length}{' '}
                        {requests.length === 1 ? 'order' : 'orders'}
                        {isAdmin ? ' across all branches' : ' at your branch'}
                    </p>
                </div>
            </CardHeader>

            <CustomerOrdersFilter
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />

            <CardContent className="p-0">
                <DataTable<ICustomerOrder>
                    columns={columns}
                    rows={requests}
                    getRowKey={(req) => req.id}
                    isLoading={isLoading}
                    stickyHeader
                    zebra
                    maxHeight="640px"
                    empty={
                        <EmptyState
                            icon={<Inbox size={20} />}
                            title={
                                hasFilters
                                    ? 'No orders match your filters'
                                    : 'No orders yet'
                            }
                            description={
                                hasFilters
                                    ? 'Try clearing the search or selecting a different status.'
                                    : 'Pickup orders from customers will appear here.'
                            }
                        />
                    }
                />
            </CardContent>
        </Card>
    );
}
