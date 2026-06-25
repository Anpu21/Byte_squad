import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import Pill, { type PillTone } from '@/components/ui/Pill';
import { auditService } from '@/services/audit.service';
import { queryKeys } from '@/lib/queryKeys';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

const PAGE_SIZE = 50;

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
    const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);

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
                        className={INPUT_CLASS}
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
                        className={INPUT_CLASS}
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
                        className={INPUT_CLASS}
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

                {!logsQuery.isLoading && rows.length === 0 ? (
                    <EmptyState
                        title="No activity recorded"
                        description="Mutating API calls will appear here as they happen."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-2/60 border-b border-border">
                                <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                    <th className="px-3 py-2.5 font-medium">
                                        When
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Actor
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Method
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Path
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Took
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-border hover:bg-surface-2/40 transition-colors"
                                    >
                                        <td className="px-3 py-2 text-[12px] text-text-2 whitespace-nowrap">
                                            {new Date(
                                                log.createdAt,
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-[12px] text-text-2">
                                            {log.userRole ?? '—'}
                                            {log.userId
                                                ? ` · ${log.userId.slice(0, 8)}…`
                                                : ''}
                                        </td>
                                        <td className="px-3 py-2">
                                            <Pill
                                                tone={methodTone(log.method)}
                                                dot={false}
                                            >
                                                {log.method}
                                            </Pill>
                                        </td>
                                        <td className="px-3 py-2 text-[12px] text-text-1 mono max-w-[320px] truncate">
                                            {log.path}
                                        </td>
                                        <td className="px-3 py-2">
                                            <Pill
                                                tone={statusTone(
                                                    log.statusCode,
                                                )}
                                                dot={false}
                                            >
                                                {log.statusCode}
                                            </Pill>
                                        </td>
                                        <td className="px-3 py-2 text-right text-[12px] text-text-3 tabular-nums">
                                            {log.durationMs} ms
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {total > PAGE_SIZE && (
                    <div className="flex items-center justify-between p-3 border-t border-border">
                        <span className="text-xs text-text-3">
                            Page {page + 1} of {pageCount}
                        </span>
                        <div className="flex gap-1.5">
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={page + 1 >= pageCount}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
