import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    DataTable,
    EmptyState,
    FIELD_SHELL,
    FIELD_BORDER,
    Pill,
    type DataTableColumn,
    type PillTone,
} from '@/components/ui';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { auditService } from '@/services/audit.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IAuditLog } from '@/types';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function methodTone(method: string): PillTone {
    switch (method) {
        case 'POST':
            return 'success';
        case 'PATCH':
        case 'PUT':
            return 'info';
        case 'DELETE':
            return 'danger';
        default:
            return 'neutral';
    }
}

function statusTone(status: number): PillTone {
    if (status >= 500) return 'danger';
    if (status >= 400) return 'warning';
    return 'success';
}

/**
 * Append-only activity log — every mutating API call with actor, path,
 * outcome, and duration. Admin only; bodies are never recorded.
 */
export function AuditLogPage() {
    const [method, setMethod] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(0);

    const params = {
        method: method || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
    };
    const logsQuery = useQuery({
        queryKey: queryKeys.audit.logs(params),
        queryFn: () => auditService.list(params),
        staleTime: 10_000,
    });

    const rows = logsQuery.data?.rows ?? [];
    const total = logsQuery.data?.total ?? 0;

    const columns: DataTableColumn<IAuditLog>[] = [
        {
            key: 'when',
            header: 'When',
            className: 'text-[12px] text-text-2 whitespace-nowrap',
            render: (log) => new Date(log.createdAt).toLocaleString(),
        },
        {
            key: 'actor',
            header: 'Actor',
            className: 'text-[12px] text-text-2',
            render: (log) =>
                `${log.userRole ?? '—'}${
                    log.userId ? ` · ${log.userId.slice(0, 8)}…` : ''
                }`,
        },
        {
            key: 'method',
            header: 'Method',
            render: (log) => (
                <Pill tone={methodTone(log.method)} dot={false}>
                    {log.method}
                </Pill>
            ),
        },
        {
            key: 'path',
            header: 'Path',
            className: 'text-[12px] text-text-1 mono max-w-[320px] truncate',
            render: (log) => log.path,
        },
        {
            key: 'status',
            header: 'Status',
            render: (log) => (
                <Pill tone={statusTone(log.statusCode)} dot={false}>
                    {log.statusCode}
                </Pill>
            ),
        },
        {
            key: 'took',
            header: 'Took',
            align: 'right',
            className: 'text-[12px] text-text-3 tabular-nums',
            render: (log) => `${log.durationMs} ms`,
        },
    ];

    const pager =
        total > 0 ? (
            <Pagination
                page={page + 1}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={(next) => setPage(next - 1)}
                unit="entries"
            />
        ) : undefined;

    return (
        <div>
            <PageHeader
                eyebrow="System"
                title="Audit log"
                subtitle="Every change made through the API — who, what, when, and the outcome. Request bodies are never stored."
            />
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                    <select
                        className={`${INPUT_CLASS} field-select`}
                        value={method}
                        onChange={(e) => {
                            setMethod(e.target.value);
                            setPage(0);
                        }}
                        aria-label="Filter by method"
                    >
                        <option value="">All methods</option>
                        <option value="POST">POST</option>
                        <option value="PATCH">PATCH</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <input
                        className={`${INPUT_CLASS} w-64`}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        placeholder="Search path, e.g. /pos/sales"
                        aria-label="Search path"
                    />
                    <input
                        className={`${INPUT_CLASS}${(startDate) ? '' : ' date-empty'}`}
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setPage(0);
                        }}
                        aria-label="Start date"
                    />
                    <span className="text-text-3 text-sm">→</span>
                    <input
                        className={`${INPUT_CLASS}${(endDate) ? '' : ' date-empty'}`}
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setPage(0);
                        }}
                        aria-label="End date"
                    />
                    <span className="ml-auto text-xs text-text-3 tabular-nums">
                        {total} entries
                    </span>
                </div>

                <DataTable
                    columns={columns}
                    rows={rows}
                    getRowKey={(log) => log.id}
                    isLoading={logsQuery.isLoading}
                    zebra
                    footer={pager}
                    empty={
                        <EmptyState
                            title="No activity recorded"
                            description="Mutating API calls will appear here as they happen."
                        />
                    }
                />
            </Card>
        </div>
    );
}
