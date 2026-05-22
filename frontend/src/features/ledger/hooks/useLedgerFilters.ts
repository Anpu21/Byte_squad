import { useCallback, useEffect, useRef, useState } from 'react';
import { dateRangeForPeriod } from '../lib/period';
import type {
    LedgerAccountType,
    LedgerEntryType,
    LedgerTimePeriod,
} from '../types/filters.type';

const SEARCH_DEBOUNCE_MS = 300;

export interface LedgerFiltersState {
    entryType: LedgerEntryType;
    setEntryType: (value: LedgerEntryType) => void;
    accountType: LedgerAccountType;
    setAccountType: (value: LedgerAccountType) => void;
    timePeriod: LedgerTimePeriod;
    setTimePeriod: (value: LedgerTimePeriod) => void;
    search: string;
    setSearch: (value: string) => void;
    debouncedSearch: string;
    startDate: string;
    setStartDate: (value: string) => void;
    endDate: string;
    setEndDate: (value: string) => void;
    page: number;
    setPage: (page: number | ((p: number) => number)) => void;
    handleAccountTypeChange: (type: LedgerAccountType) => void;
    handleTimePeriodChange: (period: LedgerTimePeriod) => void;
}

export function useLedgerFilters(): LedgerFiltersState {
    const [entryType, setEntryType] = useState<LedgerEntryType>('all');
    const [accountType, setAccountType] = useState<LedgerAccountType>('all');
    const [timePeriod, setTimePeriod] = useState<LedgerTimePeriod>('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const handleAccountTypeChange = useCallback((type: LedgerAccountType) => {
        setAccountType(type);
        setPage(1);
        if (type === 'all') setEntryType('all');
        else if (type === 'assets' || type === 'equity') setEntryType('credit');
        else if (type === 'liabilities') setEntryType('debit');
    }, []);

    const handleTimePeriodChange = useCallback((period: LedgerTimePeriod) => {
        setTimePeriod(period);
        setPage(1);
        const range = dateRangeForPeriod(period);
        setStartDate(range.startDate);
        setEndDate(range.endDate);
    }, []);

    return {
        entryType,
        setEntryType,
        accountType,
        setAccountType,
        timePeriod,
        setTimePeriod,
        search,
        setSearch,
        debouncedSearch,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        page,
        setPage,
        handleAccountTypeChange,
        handleTimePeriodChange,
    };
}
