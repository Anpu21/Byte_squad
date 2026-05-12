import { UserRole } from '@/constants/enums';

const LABELS: Record<string, string> = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.MANAGER]: 'Manager',
    [UserRole.CASHIER]: 'Cashier',
};

interface RoleBadgeProps {
    role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
    if (role === UserRole.ADMIN) {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary text-text-inv uppercase tracking-widest">
                {LABELS[role]}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-transparent text-text-1 border border-border-strong uppercase tracking-widest">
            {LABELS[role] || role}
        </span>
    );
}
