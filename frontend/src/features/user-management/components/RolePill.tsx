import Pill from '@/components/ui/Pill';
import { UserRole } from '@/constants/enums';

const ROLE_LABELS: Record<string, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.MANAGER]: 'Manager',
    [UserRole.CASHIER]: 'Cashier',
    [UserRole.CUSTOMER]: 'Customer',
};

interface RolePillProps {
    role: string;
}

export function RolePill({ role }: RolePillProps) {
    if (role === UserRole.ADMIN) return <Pill tone="primary">Admin</Pill>;
    if (role === UserRole.MANAGER) return <Pill tone="info">Manager</Pill>;
    if (role === UserRole.CUSTOMER) return <Pill tone="warning">Customer</Pill>;
    return <Pill tone="neutral">{ROLE_LABELS[role] || role}</Pill>;
}
