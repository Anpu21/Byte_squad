import Card from '@/components/ui/Card';
import type { IUser } from '@/types';
import { UserRow } from './UserRow';

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
    return (
        <Card>
            <div className="overflow-auto max-h-[calc(100vh-320px)]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface-2 z-[1]">
                            <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 border-b border-border">
                                <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                    User
                                </th>
                                <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                    Email
                                </th>
                                <th className="px-5 py-2.5 font-semibold whitespace-nowrap hidden md:table-cell">
                                    Phone
                                </th>
                                <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                    Role
                                </th>
                                <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                    Branch
                                </th>
                                <th className="px-5 py-2.5 font-semibold whitespace-nowrap hidden lg:table-cell">
                                    Address
                                </th>
                                <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                    Status
                                </th>
                                <th className="px-5 py-2.5 font-semibold whitespace-nowrap hidden xl:table-cell">
                                    Joined
                                </th>
                                <th className="px-5 py-2.5 font-semibold text-right" />
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {users.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-5 py-16 text-center text-text-3"
                                    >
                                        {hasFilters
                                            ? 'No users match your filters'
                                            : 'No users found'}
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        branchName={getBranchName(user.branchId)}
                                        isMenuOpen={openMenuId === user.id}
                                        onToggleMenu={() => onToggleMenu(user.id)}
                                        onEdit={onEdit}
                                        onRequestResetPassword={
                                            onRequestResetPassword
                                        }
                                        onRequestDelete={onRequestDelete}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-text-3 bg-surface-2">
                <span>
                    Showing {users.length} of {totalCount} users
                </span>
            </div>
        </Card>
    );
}
