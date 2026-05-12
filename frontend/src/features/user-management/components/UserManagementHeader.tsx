import { UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';

interface UserManagementHeaderProps {
    activeCount: number;
    totalCount: number;
    canInvite: boolean;
    onInvite: () => void;
}

export function UserManagementHeader({
    activeCount,
    totalCount,
    canInvite,
    onInvite,
}: UserManagementHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Users
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    {activeCount} active{' '}
                    {activeCount === 1 ? 'member' : 'members'} · {totalCount}{' '}
                    total
                </p>
            </div>
            <Button onClick={onInvite} disabled={!canInvite}>
                <UserPlus size={14} />
                Invite user
            </Button>
        </div>
    );
}
