import Avatar from '@/components/ui/Avatar';
import type { IUser } from '@/types';
import { RolePill } from './RolePill';
import { UserStatusBadge } from './UserStatusBadge';
import { UserActionsMenu } from './UserActionsMenu';

interface UserRowProps {
    user: IUser;
    branchName: string;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onEdit: (user: IUser) => void;
    onRequestResetPassword: (user: IUser) => void;
    onRequestDelete: (user: IUser) => void;
}

export function UserRow({
    user,
    branchName,
    isMenuOpen,
    onToggleMenu,
    onEdit,
    onRequestResetPassword,
    onRequestDelete,
}: UserRowProps) {
    return (
        <tr className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors group">
            <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                    <Avatar
                        name={`${user.firstName} ${user.lastName}`}
                        src={user.avatarUrl ?? undefined}
                        size={32}
                    />
                    <span className="text-text-1 font-medium">
                        {user.firstName} {user.lastName}
                    </span>
                </div>
            </td>
            <td className="px-5 py-3 text-text-2 text-[13px]">{user.email}</td>
            <td className="px-5 py-3 text-text-2 text-[13px] hidden md:table-cell">
                {user.phone || '—'}
            </td>
            <td className="px-5 py-3">
                <RolePill role={user.role} />
            </td>
            <td className="px-5 py-3 text-text-2 text-[13px]">{branchName}</td>
            <td
                className="px-5 py-3 text-text-2 text-[13px] hidden lg:table-cell max-w-[220px]"
                title={user.address ?? undefined}
            >
                <span className="block truncate">{user.address || '—'}</span>
            </td>
            <td className="px-5 py-3">
                <UserStatusBadge user={user} />
            </td>
            <td className="px-5 py-3 text-text-3 text-[13px] hidden xl:table-cell">
                {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td className="px-5 py-3 text-right">
                <UserActionsMenu
                    user={user}
                    isOpen={isMenuOpen}
                    onToggle={onToggleMenu}
                    onEdit={onEdit}
                    onRequestResetPassword={onRequestResetPassword}
                    onRequestDelete={onRequestDelete}
                />
            </td>
        </tr>
    );
}
