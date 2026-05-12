import { useUserManagementPage } from '@/features/user-management/hooks/useUserManagementPage';
import { UserManagementHeader } from '@/features/user-management/components/UserManagementHeader';
import { UserFilters } from '@/features/user-management/components/UserFilters';
import { UserTable } from '@/features/user-management/components/UserTable';
import { CreateUserModal } from '@/features/user-management/components/CreateUserModal';

export default function UserManagementPage() {
    const p = useUserManagementPage();

    return (
        <div className="animate-in fade-in duration-500">
            <UserManagementHeader
                activeCount={p.activeCount}
                totalCount={p.users.length}
                canInvite={p.branches.length > 0}
                onInvite={() => p.setShowCreateModal(true)}
            />

            <UserFilters
                branches={p.branches}
                searchQuery={p.searchQuery}
                setSearchQuery={p.setSearchQuery}
                roleFilter={p.roleFilter}
                setRoleFilter={p.setRoleFilter}
                branchFilter={p.branchFilter}
                setBranchFilter={p.setBranchFilter}
            />

            <UserTable
                users={p.filteredUsers}
                totalCount={p.users.length}
                isLoading={p.isLoading}
                hasFilters={p.hasFilters}
                openMenuId={p.openMenuId}
                onToggleMenu={(id) =>
                    p.setOpenMenuId(p.openMenuId === id ? null : id)
                }
                getBranchName={p.getBranchName}
                onResendCredentials={p.mutations.resendCredentials}
                onResetPassword={p.mutations.confirmAndResetPassword}
                onDelete={p.mutations.confirmAndDelete}
            />

            {p.showCreateModal && p.branches.length > 0 && (
                <CreateUserModal
                    branches={p.branches}
                    onClose={() => p.setShowCreateModal(false)}
                    onCreated={p.mutations.invalidate}
                />
            )}
        </div>
    );
}
