import { useUserManagementPage } from '@/features/user-management/hooks/useUserManagementPage';
import { UserManagementHeader } from '@/features/user-management/components/UserManagementHeader';
import { UserFilters } from '@/features/user-management/components/UserFilters';
import { UserTable } from '@/features/user-management/components/UserTable';
import { UserFormModal } from '@/features/user-management/components/UserFormModal';
import { UserActionOtpModal } from '@/features/user-management/components/UserActionOtpModal';

export function UserManagementPage() {
    const p = useUserManagementPage();
    const formOpen = p.showCreateModal || p.editingUser !== null;

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
                onEdit={(user) => p.setEditingUser(user)}
                onRequestResetPassword={p.confirmAndRequestReset}
                onRequestDelete={p.confirmAndRequestDelete}
            />

            {formOpen && p.branches.length > 0 && (
                <UserFormModal
                    user={p.editingUser}
                    branches={p.branches}
                    onClose={() => {
                        p.setShowCreateModal(false);
                        p.setEditingUser(null);
                    }}
                    onStaged={p.handleStaged}
                />
            )}

            {p.pending && (
                <UserActionOtpModal
                    actionId={p.pending.response.actionId}
                    expiresAt={p.pending.response.expiresAt}
                    action={p.pending.response.action}
                    targetLabel={p.pending.targetLabel}
                    onClose={p.closePending}
                    onConfirmed={p.handleConfirmed}
                />
            )}
        </div>
    );
}
