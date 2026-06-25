import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import {
    Avatar,
    Card,
    DataTable,
    EmptyState,
    Pagination,
    type DataTableColumn,
} from '@/components/ui';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import type { IEmployee } from '@/types';
import { useEmployees } from '../hooks/useEmployees';
import { EmployeesFilters } from './EmployeesFilters';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';

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
    const hasAnyFilter = Boolean(search || branchId || status);

    function goToEmployee(id: string) {
        navigate(FRONTEND_ROUTES.ADMIN_EMPLOYEE_EDIT.replace(':id', id));
    }

    const columns: DataTableColumn<IEmployee>[] = [
        {
            key: 'employee',
            header: 'Employee',
            render: (e) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        name={e.fullName}
                        src={e.photoUrl ?? undefined}
                        size={32}
                    />
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-text-1 truncate">
                            {e.fullName}
                        </p>
                        <p className="text-[11px] text-text-3 truncate">
                            {e.role}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            numeric: true,
            className: 'text-[12px] text-text-2',
            render: (e) => e.employeeCode,
        },
        {
            key: 'nic',
            header: 'NIC',
            numeric: true,
            className: 'text-[12px] text-text-2',
            render: (e) => e.nic ?? '—',
        },
        {
            key: 'contact',
            header: 'Contact',
            className: 'text-[12px] text-text-2 truncate',
            render: (e) => e.contactPhone,
        },
        {
            key: 'status',
            header: 'Status',
            render: (e) => <EmployeeStatusBadge status={e.status} />,
        },
        {
            key: 'hired',
            header: 'Hired',
            align: 'right',
            className: 'text-[12px] text-text-3 tabular-nums whitespace-nowrap',
            render: (e) => formatHireDate(e.hireDate),
        },
        {
            key: 'edit',
            header: 'Edit',
            align: 'right',
            render: (e) => (
                <button
                    type="button"
                    onClick={(ev) => {
                        ev.stopPropagation();
                        goToEmployee(e.id);
                    }}
                    aria-label={`Edit ${e.fullName}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-3 hover:text-text-1 hover:bg-surface-2 transition-colors"
                >
                    <Pencil size={13} />
                </button>
            ),
        },
    ];

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
            <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(e) => e.id}
                onRowClick={(e) => goToEmployee(e.id)}
                getRowLabel={(e) => `Edit ${e.fullName}`}
                isLoading={isLoading}
                zebra
                empty={
                    <EmptyState
                        title="No employees yet"
                        description={
                            hasAnyFilter
                                ? 'Try a different filter combination.'
                                : 'Add your first employee to start tracking attendance, leave, and payroll.'
                        }
                    />
                }
                footer={
                    total > PAGE_SIZE ? (
                        <Pagination
                            offset={offset}
                            pageCount={rows.length}
                            total={total}
                            limit={PAGE_SIZE}
                            unit="employees"
                            onPrev={() =>
                                setOffset((o) => Math.max(0, o - PAGE_SIZE))
                            }
                            onNext={() => setOffset((o) => o + PAGE_SIZE)}
                        />
                    ) : null
                }
            />
        </Card>
    );
}
