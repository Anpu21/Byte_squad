import { LuClipboardList as ClipboardList } from 'react-icons/lu';
import {
    Button,
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import type { IStockAdjustment } from '@/types';
import { AdjustmentStatusPill } from './AdjustmentStatusPill';
import { reasonLabel } from '../lib/reason';

interface AdjustmentsTableProps {
    rows: IStockAdjustment[];
    isLoading: boolean;
    canManage: boolean;
    isMutating: boolean;
    onApprove: (id: string) => void;
    onReverse: (id: string) => void;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function AdjustmentsTable({
    rows,
    isLoading,
    canManage,
    isMutating,
    onApprove,
    onReverse,
}: AdjustmentsTableProps) {
    const columns: DataTableColumn<IStockAdjustment>[] = [
        {
            key: 'date',
            header: 'Date',
            className: 'text-text-2 whitespace-nowrap',
            render: (r) => formatDate(r.createdAt),
        },
        {
            key: 'product',
            header: 'Product',
            render: (r) => (
                <div>
                    <div className="text-[13px] font-medium text-text-1">
                        {r.product?.name ?? '—'}
                    </div>
                    <div className="text-[11px] text-text-3">
                        {r.product?.barcode ?? ''}
                    </div>
                </div>
            ),
        },
        {
            key: 'branch',
            header: 'Branch',
            className: 'text-text-2',
            render: (r) => r.branch?.name ?? '—',
        },
        {
            key: 'reason',
            header: 'Reason',
            className: 'text-text-2',
            render: (r) => reasonLabel(r.reason),
        },
        {
            key: 'beforeAfter',
            header: 'Before → After',
            align: 'right',
            numeric: true,
            className: 'whitespace-nowrap',
            render: (r) => `${r.quantityBefore} → ${r.physicalQuantity}`,
        },
        {
            key: 'delta',
            header: 'Δ',
            align: 'right',
            numeric: true,
            render: (r) => {
                const negative = Number(r.difference) < 0;
                return (
                    <span className={negative ? 'text-danger' : 'text-accent-text'}>
                        {negative ? '' : '+'}
                        {r.difference}
                    </span>
                );
            },
        },
        {
            key: 'status',
            header: 'Status',
            render: (r) => <AdjustmentStatusPill status={r.status} />,
        },
        ...(canManage
            ? [
                  {
                      key: 'actions',
                      header: 'Actions',
                      align: 'right',
                      render: (r: IStockAdjustment) => (
                          <div className="whitespace-nowrap">
                              {r.status === 'Pending' && (
                                  <Button
                                      size="sm"
                                      variant="secondary"
                                      disabled={isMutating}
                                      onClick={() => onApprove(r.id)}
                                  >
                                      Approve
                                  </Button>
                              )}
                              {r.status === 'Approved' && (
                                  <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={isMutating}
                                      onClick={() => onReverse(r.id)}
                                  >
                                      Reverse
                                  </Button>
                              )}
                          </div>
                      ),
                  } satisfies DataTableColumn<IStockAdjustment>,
              ]
            : []),
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            isLoading={isLoading}
            zebra
            empty={
                <EmptyState
                    icon={<ClipboardList size={20} />}
                    title="No stock adjustments"
                    description="Record a stock-take, damage, theft, or expiry correction to see it here."
                />
            }
        />
    );
}
