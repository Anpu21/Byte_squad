import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '../hooks/useEmployees';
import { EmployeesFilters } from './EmployeesFilters';
import { EmployeesTableRow } from './EmployeesTableRow';

type EmployeeStatus = 'Active' | 'Resigned' | 'Terminated' | 'OnLeave' | '';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

function formatHireDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function EmployeesTable() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const canPickBranch = user?.role === UserRole.ADMIN;

    const [searchDraft, setSearchDraft] = useState('');
    const [search, setSearch] = useState('');
    const [branchId, setBranchId] = useState('');
    const [status, setStatus] = useState<EmployeeStatus>('');
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchDraft.trim());
            setOffset(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchDraft]);

    function handleBranchIdChange(next: string) {
        setBranchId(next);
        setOffset(0);
    }

    function handleStatusChange(next: EmployeeStatus) {
        setStatus(next);
        setOffset(0);
    }

    const { data, isLoading } = useEmployees({
        search: search || undefined,
        branchId: branchId || undefined,
        status: status || undefined,
        limit: PAGE_SIZE,
        offset,
    });

    const rows = data?.rows ?? [];
    const total = data?.total ?? 0;
    const pageStart = total === 0 ? 0 : offset + 1;
    const pageEnd = Math.min(total, offset + rows.length);
    const hasAnyFilter = Boolean(search || branchId || status);

    return (
        <Card className="overflow-hidden">
            <EmployeesFilters
                searchDraft={searchDraft}
                onSearchDraftChange={setSearchDraft}
                branchId={branchId}
                onBranchIdChange={handleBranchIdChange}
                status={status}
                onStatusChange={handleStatusChange}
                canPickBranch={canPickBranch}
            />
            <div className="px-5 py-2 border-b border-border bg-surface-2/30 flex items-center justify-end">
                <p className="text-[11px] text-text-3 tabular-nums">
                    {total === 0
                        ? 'No employees'
                        : `${pageStart}–${pageEnd} of ${total}`}
                </p>
            </div>

            {rows.length === 0 && !isLoading ? (
                <EmptyState
                    title="No employees yet"
                    description={
                        hasAnyFilter
                            ? 'Try a different filter combination.'
                            : 'Add your first employee to start tracking attendance, leave, and payroll.'
                    }
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2">
                                <th className="px-5 py-2.5 font-semibold">Employee</th>
                                <th className="px-5 py-2.5 font-semibold">Code</th>
                                <th className="px-5 py-2.5 font-semibold">NIC</th>
                                <th className="px-5 py-2.5 font-semibold">Contact</th>
                                <th className="px-5 py-2.5 font-semibold">Status</th>
                                <th className="px-5 py-2.5 font-semibold text-right">
                                    Hired
                                </th>
                                <th className="px-5 py-2.5 font-semibold text-right">
                                    Edit
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <EmployeesTableRow
                                    key={row.id}
                                    employee={row}
                                    formatHireDate={formatHireDate}
                                    onActivate={() =>
                                        navigate(
                                            FRONTEND_ROUTES.ADMIN_EMPLOYEE_EDIT.replace(
                                                ':id',
                                                row.id,
                                            ),
                                        )
                                    }
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {total > PAGE_SIZE && (
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface-2/30">
                    <button
                        type="button"
                        disabled={offset === 0}
                        onClick={() =>
                            setOffset((o) => Math.max(0, o - PAGE_SIZE))
                        }
                        className="h-8 px-3 rounded-md border border-border text-[12px] font-semibold text-text-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        disabled={offset + PAGE_SIZE >= total}
                        onClick={() => setOffset((o) => o + PAGE_SIZE)}
                        className="h-8 px-3 rounded-md border border-border text-[12px] font-semibold text-text-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2"
                    >
                        Next
                    </button>
                </div>
            )}
        </Card>
    );
}
