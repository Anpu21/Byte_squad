import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IBranch, IUser } from '@/types';
import { useUserMutations } from './useUserMutations';

export function useUserManagementPage() {
    const usersQuery = useQuery({
        queryKey: queryKeys.users.all(),
        queryFn: userService.getAll,
    });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
    });
    const mutations = useUserMutations();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
    const branches = useMemo(
        () => branchesQuery.data ?? [],
        [branchesQuery.data],
    );

    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return users.filter((user: IUser) => {
            const matchesSearch =
                !q ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
                user.email.toLowerCase().includes(q);
            const matchesRole =
                roleFilter === 'all' || user.role === roleFilter;
            const matchesBranch =
                branchFilter === 'all' || user.branchId === branchFilter;
            return matchesSearch && matchesRole && matchesBranch;
        });
    }, [users, searchQuery, roleFilter, branchFilter]);

    const activeCount = users.filter((u: IUser) => u.isVerified).length;
    const hasFilters =
        Boolean(searchQuery) || roleFilter !== 'all' || branchFilter !== 'all';

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
        searchQuery,
        setSearchQuery,
        roleFilter,
        setRoleFilter,
        branchFilter,
        setBranchFilter,
        openMenuId,
        setOpenMenuId,
        getBranchName,
        mutations,
    };
}
