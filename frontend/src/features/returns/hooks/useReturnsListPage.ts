import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { returnsService } from '@/services/returns.service';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IReturnsParams } from '@/types';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';

const PAGE_LIMIT = DEFAULT_PAGE_SIZE;

/**
 * Returns list state for the hub's List tab. Server-paginated with role-aware
 * filters: an admin-only branch picker (managers/cashiers are auto-scoped by
 * the API), a debounced invoice search and an optional date range. Any filter
 * change resets to page 1.
 */
export function useReturnsListPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const isCashier = user?.role === UserRole.CASHIER;

    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [branchId, setBranchId] = useState('');

    // Debounce the invoice search so we don't fire a request per keystroke.
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Any filter change goes back to the first page.
    useEffect(() => {
        setPage(1);
    }, [search, startDate, endDate, branchId]);

    const branchesQuery = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        enabled: isAdmin,
        staleTime: 5 * 60_000,
    });

    const params: IReturnsParams = {
        page,
        limit: PAGE_LIMIT,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: isAdmin && branchId ? branchId : undefined,
    };

    const query = useQuery({
        queryKey: queryKeys.returns.list(params),
        queryFn: () => returnsService.list(params),
        placeholderData: keepPreviousData,
    });

    const data = query.data;

    return {
        rows: data?.items ?? [],
        total: data?.total ?? 0,
        totalPages: data?.totalPages ?? 1,
        page,
        setPage,
        isLoading: query.isLoading,
        isError: query.isError,
        // filters
        isAdmin,
        isCashier,
        branches: branchesQuery.data ?? [],
        searchInput,
        setSearch: setSearchInput,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        branchId,
        setBranchId,
    };
}
