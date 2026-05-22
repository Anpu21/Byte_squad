import Pill from '@/components/ui/Pill';
import type { IUser } from '@/types';

interface UserStatusBadgeProps {
    user: IUser;
}

export function UserStatusBadge({ user }: UserStatusBadgeProps) {
    if (!user.isVerified) {
        return <Pill tone="warning">Invited</Pill>;
    }
    return <Pill tone="success">Active</Pill>;
}
