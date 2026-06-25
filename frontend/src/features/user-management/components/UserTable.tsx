import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';
import type { IUser } from '@/types';
import { RolePill } from './RolePill';
import { UserStatusBadge } from './UserStatusBadge';
import { UserActionsMenu } from './UserActionsMenu';

interface UserTableProps {
    users: IUser[];
    totalCount: number;
    isLoading: boolean;
    hasFilters: boolean;
    openMenuId: string | null;
    onToggleMenu: (id: string) => void;
    getBranchName: (branchId: string | null) => string;
    onEdit: (user: IUser) => void;
    onRequestResetPassword: (user: IUser) => void;
    onRequestDelete: (user: IUser) => void;
}

export function UserTable({
    users,
    totalCount,
    isLoading,
    hasFilters,
    openMenuId,
    onToggleMenu,
    getBranchName,
    onEdit,
    onRequestResetPassword,
    onRequestDelete,
}: UserTableProps) {
    const columns: DataTableColumn<IUser>[] = [
        {
            key: 'user',
            header: 'User',
            render: (user) => (
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
            ),
        },
        {
            key: 'email',
            header: 'Email',
            className: 'text-text-2',
            render: (user) => user.email,
        },
        {
            key: 'phone',
            header: 'Phone',
            className: 'text-text-2 hidden md:table-cell',
            headerClassName: 'hidden md:table-cell',
            render: (user) => user.phone || '—',
        },
        {
            key: 'role',
            header: 'Role',
            render: (user) => <RolePill role={user.role} />,
        },
        {
            key: 'branch',
            header: 'Branch',
            className: 'text-text-2',
            render: (user) => getBranchName(user.branchId),
        },
        {
            key: 'address',
            header: 'Address',
            className: 'text-text-2 hidden lg:table-cell max-w-[220px]',
            headerClassName: 'hidden lg:table-cell',
            render: (user) => (
                <span className="block truncate" title={user.address ?? undefined}>
                    {user.address || '—'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (user) => <UserStatusBadge user={user} />,
        },
        {
            key: 'joined',
            header: 'Joined',
            className: 'text-text-3 hidden xl:table-cell',
            headerClassName: 'hidden xl:table-cell',
            render: (user) => new Date(user.createdAt).toLocaleDateString(),
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (user) => (
                <UserActionsMenu
                    user={user}
                    isOpen={openMenuId === user.id}
                    onToggle={() => onToggleMenu(user.id)}
                    onEdit={onEdit}
                    onRequestResetPassword={onRequestResetPassword}
                    onRequestDelete={onRequestDelete}
                />
            ),
        },
    ];

    return (
        <Card>
            <DataTable
                columns={columns}
                rows={users}
                getRowKey={(user) => user.id}
                isLoading={isLoading}
                stickyHeader
                zebra
                maxHeight="calc(100vh - 320px)"
                empty={
                    <EmptyState
                        title={hasFilters ? 'No users match your filters' : 'No users found'}
                    />
                }
                footer={
                    <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-text-3 bg-surface-2">
                        <span>
                            Showing {users.length} of {totalCount} users
                        </span>
                    </div>
                }
            />
        </Card>
    );
}
