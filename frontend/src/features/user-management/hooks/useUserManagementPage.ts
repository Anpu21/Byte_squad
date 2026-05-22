import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';
import type { IBranch, IUser } from '@/types';

function extractApiMessage(err: unknown): string | undefined {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr?.response?.data?.message;
}

export function useUserManagementPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const usersQuery = useQuery({
        queryKey: queryKeys.users.all(),
        queryFn: userService.getAll,
    });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
    });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<IUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const users = useMemo<IUser[]>(
        () => usersQuery.data ?? [],
        [usersQuery.data],
    );
    const branches = useMemo<IBranch[]>(
        () => branchesQuery.data ?? [],
        [branchesQuery.data],
    );

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });

    const deleteMutation = useMutation({
        mutationFn: (user: IUser) => userService.remove(user.id),
        onSuccess: () => {
            toast.success('User deleted');
            invalidate();
        },
        onError: (err: unknown) =>
            toast.error(extractApiMessage(err) ?? 'Failed to delete user'),
    });

    const resetMutation = useMutation({
        mutationFn: (user: IUser) => userService.resetPassword(user.id),
        onSuccess: () => {
            toast.success(
                'Password reset — a fresh temporary password was emailed to the user',
            );
            invalidate();
        },
        onError: (err: unknown) =>
            toast.error(extractApiMessage(err) ?? 'Failed to reset password'),
    });

    const confirmAndDelete = async (user: IUser) => {
        const ok = await confirm({
            title: 'Delete user?',
            body: `Delete ${user.firstName} ${user.lastName}. This action cannot be undone.`,
            confirmLabel: 'Delete user',
            tone: 'danger',
        });
        if (ok) deleteMutation.mutate(user);
    };

    const confirmAndReset = async (user: IUser) => {
        const ok = await confirm({
            title: 'Reset password?',
            body: `Reset password for ${user.firstName} ${user.lastName}. A fresh temporary password will be emailed to the user.`,
            confirmLabel: 'Reset password',
        });
        if (ok) resetMutation.mutate(user);
    };

    const handleSaved = () => {
        setShowCreateModal(false);
        setEditingUser(null);
        invalidate();
    };

    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return users.filter((user: IUser) => {
            const matchesSearch =
                !q ||
                `${user.firstName} ${user.lastName}`
                    .toLowerCase()
                    .includes(q) ||
                user.email.toLowerCase().includes(q) ||
                (user.phone?.toLowerCase().includes(q) ?? false);
            const matchesRole =
                roleFilter === 'all' || user.role === roleFilter;
            const matchesBranch =
                branchFilter === 'all' || user.branchId === branchFilter;
            return matchesSearch && matchesRole && matchesBranch;
        });
    }, [users, searchQuery, roleFilter, branchFilter]);

    const activeCount = users.filter((u: IUser) => u.isVerified).length;
    const hasFilters =
        Boolean(searchQuery) ||
        roleFilter !== 'all' ||
        branchFilter !== 'all';

    const getBranchName = (branchId: string | null) => {
        if (!branchId) return '—';
        return branches.find((b: IBranch) => b.id === branchId)?.name ?? '—';
    };

    return {
        users,
        branches,
        filteredUsers,
        isLoading: usersQuery.isLoading,
        activeCount,
        hasFilters,
        showCreateModal,
        setShowCreateModal,
        editingUser,
        setEditingUser,
        handleSaved,
        searchQuery,
        setSearchQuery,
        roleFilter,
        setRoleFilter,
        branchFilter,
        setBranchFilter,
        openMenuId,
        setOpenMenuId,
        getBranchName,
        confirmAndDelete,
        confirmAndReset,
    };
}
