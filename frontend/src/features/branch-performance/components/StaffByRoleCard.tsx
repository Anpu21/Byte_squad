import { Building2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { IMyBranchPerformance } from '@/types';

interface StaffByRoleCardProps {
    staff: IMyBranchPerformance['staff'];
}

export function StaffByRoleCard({ staff }: StaffByRoleCardProps) {
    const roles = [
        { label: 'Admin', count: staff.byRole.admin },
        { label: 'Manager', count: staff.byRole.manager },
        { label: 'Cashier', count: staff.byRole.cashier },
    ];

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                        Team
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        {staff.total} member{staff.total === 1 ? '' : 's'}
                    </p>
                </div>
                <Building2 size={16} className="text-text-3" />
            </div>
            <div className="space-y-3">
                {roles.map((r) => (
                    <div
                        key={r.label}
                        className="flex items-center justify-between"
                    >
                        <span className="text-[13px] text-text-2">
                            {r.label}
                        </span>
                        <span className="mono text-sm font-semibold text-text-1">
                            {r.count}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-1">
                    Total
                </span>
                <span className="mono text-lg font-bold text-text-1">
                    {staff.total}
                </span>
            </div>
        </Card>
    );
}
