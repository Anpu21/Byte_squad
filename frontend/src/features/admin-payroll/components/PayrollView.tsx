import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/features/admin-employees';
import { PayrollFilters } from './PayrollFilters';
import { PayrollTable } from './PayrollTable';
import { useGeneratePayroll } from '../hooks/useGeneratePayroll';
import { usePayroll } from '../hooks/usePayroll';
import { hrService } from '@/services/hr.service';
import {
    downloadBlob,
    formatPayPeriod,
} from '../lib/payroll-formatting';
import type { PayrollStatus } from '@/types';

function currentMonthValue(): string {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${m}`;
}

function parseMonthValue(value: string): { year: number; month: number } {
    const [y, m] = value.split('-');
    return { year: Number(y), month: Number(m) };
}

const EMPLOYEE_PAGE_SIZE = 200;

interface PayrollViewProps {
    showHeader?: boolean;
}

/**
 * Manager/admin payroll workspace. Drives a month picker + branch +
 * status filters, generates a run for the selected period, approves
 * and marks rows paid, and exports the bank-file CSV.
 */
export function PayrollView({ showHeader = true }: PayrollViewProps) {
    const { user } = useAuth();
    const role = user?.role;
    const canPickBranch = role === UserRole.ADMIN;
    // Admin owns the lifecycle (generate/approve/mark-paid/cancel); managers
    // get a read-only branch view but can still export the payroll CSV.
    const canManage = role === UserRole.ADMIN;
    const canExport = role === UserRole.ADMIN || role === UserRole.MANAGER;

    const [monthValue, setMonthValue] = useState<string>(currentMonthValue);
    const [branchId, setBranchId] = useState('');
    const [status, setStatus] = useState<'' | PayrollStatus>('');
    const [isExporting, setIsExporting] = useState(false);

    const { year, month } = parseMonthValue(monthValue);
    const periodLabel = formatPayPeriod(month, year);
    const generate = useGeneratePayroll();

    const employeesQuery = useEmployees({
        branchId: canPickBranch ? branchId || undefined : undefined,
        status: 'Active',
        limit: EMPLOYEE_PAGE_SIZE,
        offset: 0,
    });
    const employees = useMemo(
        () => employeesQuery.data?.rows ?? [],
        [employeesQuery.data],
    );

    const payrollQuery = usePayroll({
        branchId: canPickBranch ? branchId || undefined : undefined,
        month,
        year,
        status: status || undefined,
        limit: 100,
        offset: 0,
    });
    const rows = payrollQuery.data?.rows ?? [];

    async function handleGenerate() {
        try {
            const res = await generate.mutateAsync({
                month,
                year,
                branchId: canPickBranch ? branchId || undefined : undefined,
            });
            const okCount = res.rows.length;
            const skippedCount = res.skipped.length;
            if (skippedCount > 0) {
                toast(
                    `Generated ${okCount} row(s); skipped ${skippedCount} employee(s) — check salary structures.`,
                    { icon: 'i' },
                );
            } else {
                toast.success(`Generated ${okCount} payroll row(s)`);
            }
        } catch {
            toast.error('Could not generate payroll');
        }
    }

    async function handleExportCsv() {
        setIsExporting(true);
        try {
            const blob = await hrService.exportPayrollCsv({
                month,
                year,
                branchId: canPickBranch ? branchId || undefined : undefined,
            });
            const mm = String(month).padStart(2, '0');
            downloadBlob(blob, `payroll-${year}-${mm}.csv`);
            toast.success('CSV downloaded');
        } catch {
            toast.error('Could not export CSV');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <>
            {showHeader && (
                <PageHeader
                    subtitle={periodLabel}
                    actions={
                        canExport ? (
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={handleExportCsv}
                                    disabled={isExporting || rows.length === 0}
                                >
                                    {isExporting ? 'Exporting…' : 'Export CSV'}
                                </Button>
                                {canManage ? (
                                    <Button
                                        variant="primary"
                                        onClick={handleGenerate}
                                        disabled={generate.isPending}
                                    >
                                        {generate.isPending
                                            ? 'Generating…'
                                            : `Generate ${periodLabel}`}
                                    </Button>
                                ) : null}
                            </div>
                        ) : null
                    }
                />
            )}
            <Card className="overflow-hidden">
                <PayrollFilters
                    monthValue={monthValue}
                    onMonthChange={setMonthValue}
                    branchId={branchId}
                    onBranchIdChange={setBranchId}
                    status={status}
                    onStatusChange={setStatus}
                    canPickBranch={canPickBranch}
                />
                <PayrollTable
                    rows={rows}
                    employees={employees}
                    isLoading={payrollQuery.isLoading}
                    canManage={canManage}
                />
            </Card>
        </>
    );
}
