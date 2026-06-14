import { useEffect, useState, type KeyboardEvent } from 'react';
import type { ISearchProductRow } from '@/types';
import { usePosProductSearch } from '@/features/pos/hooks/usePosProductSearch';

export interface UsePosItemSearchReturn {
    query: string;
    onQueryChange: (value: string) => void;
    debounced: string;
    results: ISearchProductRow[];
    isFetching: boolean;
    highlight: number;
    handleInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    selectRow: (row: ISearchProductRow) => void;
    clear: () => void;
}

/**
 * Shared item-search state for the billing grid: debounced product search,
 * keyboard highlight, and Enter-to-select. Reused by the entry row (add a new
 * line) and committed rows (re-pick the product). The consumer supplies
 * `onSelect`; `onEscape` fires when Escape is pressed on an already-empty query.
 */
export function usePosItemSearch(
    onSelect: (row: ISearchProductRow) => void,
    onEscape?: () => void,
): UsePosItemSearchReturn {
    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [highlight, setHighlight] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 250);
        return () => clearTimeout(t);
    }, [query]);

    const search = usePosProductSearch(debounced);
    const results = search.data ?? [];

    function clear() {
        setQuery('');
        setDebounced('');
        setHighlight(0);
    }

    function onQueryChange(value: string) {
        setQuery(value);
        setHighlight(0);
    }

    function selectRow(row: ISearchProductRow) {
        onSelect(row);
        clear();
    }

    function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const row =
                results[Math.min(Math.max(highlight, 0), results.length - 1)];
            if (row) selectRow(row);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (query) clear();
            else onEscape?.();
        }
    }

    return {
        query,
        onQueryChange,
        debounced,
        results,
        isFetching: search.isFetching,
        highlight,
        handleInputKeyDown,
        selectRow,
        clear,
    };
}
