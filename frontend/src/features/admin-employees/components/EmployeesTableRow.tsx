import { Pencil } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { IEmployee } from '@/types';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';

interface EmployeesTableRowProps {
    employee: IEmployee;
    onActivate: () => void;
    formatHireDate: (iso: string) => string;
}

/**
 * A single employee row. Extracted from EmployeesTable so the parent
 * stays focused on filter / paging plumbing — and to keep the table
 * file under the 200-line component cap.
 */
export function EmployeesTableRow({
    employee,
    onActivate,
    formatHireDate,
}: EmployeesTableRowProps) {
    return (
        <tr
            key={employee.id}
            onClick={onActivate}
            tabIndex={0}
            role="button"
            aria-label={`Edit ${employee.fullName}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onActivate();
                }
            }}
            className="border-t border-border hover:bg-surface-2/40 cursor-pointer transition-colors focus:outline-none focus:bg-surface-2/40 focus:ring-2 focus:ring-inset focus:ring-primary/30"
        >
            <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                    <Avatar
                        name={employee.fullName}
                        src={employee.photoUrl ?? undefined}
                        size={32}
                    />
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-text-1 truncate">
                            {employee.fullName}
                        </p>
                        <p className="text-[11px] text-text-3 truncate">
                            {employee.role}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-3 mono tabular-nums text-[12px] text-text-2">
                {employee.employeeCode}
            </td>
            <td className="px-5 py-3 mono tabular-nums text-[12px] text-text-2">
                {employee.nic ?? '—'}
            </td>
            <td className="px-5 py-3 text-[12px] text-text-2 truncate">
                {employee.contactPhone}
            </td>
            <td className="px-5 py-3">
                <EmployeeStatusBadge status={employee.status} />
            </td>
            <td className="px-5 py-3 text-right text-[12px] text-text-3 tabular-nums whitespace-nowrap">
                {formatHireDate(employee.hireDate)}
            </td>
            <td className="px-5 py-3 text-right">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onActivate();
                    }}
                    aria-label={`Edit ${employee.fullName}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-3 hover:text-text-1 hover:bg-surface-2 transition-colors"
                >
                    <Pencil size={13} />
                </button>
            </td>
        </tr>
    );
}
