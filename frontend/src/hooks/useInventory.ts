import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { inventoryService } from '@/services/inventory.service';
import type { IInventoryItem } from '@/services/inventory.service';

export function useInventory() {
  const { user } = useAuth();

  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, stockStatus]);

  // Fetch categories on mount
  useEffect(() => {
    inventoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const fetchInventory = useCallback(async () => {
    if (!user?.branchId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await inventoryService.getByBranch(user.branchId, {
        search: debouncedSearch || undefined,
        category: category || undefined,
        stockStatus: stockStatus || undefined,
        page,
        limit: 10,
      });
      setItems(result.items ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 0);
    } catch {
      setError('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, debouncedSearch, category, stockStatus, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const refetch = useCallback(() => {
    fetchInventory();
    inventoryService.getCategories().then(setCategories).catch(() => {});
  }, [fetchInventory]);

  return {
    items,
    categories,
    total,
    totalPages,
    isLoading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    stockStatus,
    setStockStatus,
    page,
    setPage,
    refetch,
  };
}
