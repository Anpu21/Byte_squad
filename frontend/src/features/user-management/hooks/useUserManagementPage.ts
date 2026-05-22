import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';
import type {
    IBranch,
    IUser,
    IUserActionRequestResponse,
} from '@/types';

interface PendingAction {
    response: IUserActionRequestResponse;
    targetLabel: string;
}

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
    const [pending, setPending] = useState<PendingAction | null>(null);
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

    const requestDeleteMutation = useMutation({
        mutationFn: (user: IUser) => userService.requestDelete(user.id),
        onSuccess: (response, user) => {
            toast.success('Verification code sent to your email');
            setPending({
                response,
                targetLabel: `${user.firstName} ${user.lastName}`,
            });
        },
        onError: (err: unknown) =>
            toast.error(
                extractApiMessage(err) ?? 'Failed to request user deletion',
            ),
    });

    const requestResetMutation = useMutation({
        mutationFn: (user: IUser) => userService.requestResetPassword(user.id),
        onSuccess: (response, user) => {
            toast.success('Verification code sent to your email');
            setPending({
                response,
                targetLabel: `${user.firstName} ${user.lastName}`,
            });
        },
        onError: (err: unknown) =>
            toast.error(
                extractApiMessage(err) ?? 'Failed to request password reset',
            ),
    });

    const confirmAndRequestDelete = async (user: IUser) => {
        const ok = await confirm({
            title: 'Delete user?',
            body: `Delete ${user.firstName} ${user.lastName}. You'll be emailed a 6-digit code to confirm — this action cannot be undone.`,
            confirmLabel: 'Send verification code',
            tone: 'danger',
        });
        if (ok) requestDeleteMutation.mutate(user);
    };

    const confirmAndRequestReset = async (user: IUser) => {
        const ok = await confirm({
            title: 'Reset password?',
            body: `Reset password for ${user.firstName} ${user.lastName}. You'll be emailed a 6-digit code; on confirmation a fresh temporary password is sent to the user.`,
            confirmLabel: 'Send verification code',
        });
        if (ok) requestResetMutation.mutate(user);
    };

    const handleStaged = (
        response: IUserActionRequestResponse,
        targetLabel: string,
    ) => {
        setPending({ response, targetLabel });
        setShowCreateModal(false);
        setEditingUser(null);
    };

    const handleConfirmed = () => {
        setPending(null);
        invalidate();
    };

    const closePending = () => setPending(null);

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
        pending,
        closePending,
        handleStaged,
        handleConfirmed,
        searchQuery,
        setSearchQuery,
        roleFilter,
        setRoleFilter,
        branchFilter,
        setBranchFilter,
        openMenuId,
        setOpenMenuId,
        getBranchName,
        confirmAndRequestDelete,
        confirmAndRequestReset,
    };
}
