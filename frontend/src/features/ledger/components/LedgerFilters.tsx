import Card from '@/components/ui/Card';
import type { IBranch } from '@/types';
import type { LedgerFiltersState } from '../hooks/useLedgerFilters';
import type {
    LedgerAccountType,
    LedgerEntryType,
    LedgerTimePeriod,
} from '../types/filters.type';
import { LedgerSearch } from './LedgerSearch';

const SELECT_CLASS =
    'h-9 px-3 bg-surface border border-border-strong text-text-1 text-sm rounded-md outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';

interface LedgerFiltersProps {
    filters: LedgerFiltersState;
    branches: IBranch[];
}

export function LedgerFilters({ filters, branches }: LedgerFiltersProps) {
    return (
        <Card className="p-4 mb-4">
            <div className="flex flex-col gap-4">
                <LedgerSearch
                    branches={branches}
                    search={filters.search}
                    branchId={filters.branchId}
                    onSearchChange={filters.setSearch}
                    onBranchChange={filters.handleBranchChange}
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
                    <select
                        aria-label="Account type"
                        value={filters.accountType}
                        onChange={(e) =>
                            filters.handleAccountTypeChange(
                                e.target.value as LedgerAccountType,
                            )
                        }
                        className={SELECT_CLASS}
                    >
                        <option value="all">All accounts</option>
                        <option value="assets">Assets</option>
                        <option value="liabilities">Liabilities</option>
                        <option value="equity">Equity</option>
                    </select>
                    <select
                        aria-label="Entry type"
                        value={filters.entryType}
                        onChange={(e) =>
                            filters.setEntryType(
                                e.target.value as LedgerEntryType,
                            )
                        }
                        className={SELECT_CLASS}
                    >
                        <option value="all">All types</option>
                        <option value="credit">Credit</option>
                        <option value="debit">Debit</option>
                    </select>
                    <select
                        aria-label="Time period"
                        value={filters.timePeriod}
                        onChange={(e) =>
                            filters.handleTimePeriodChange(
                                e.target.value as LedgerTimePeriod,
                            )
                        }
                        className={SELECT_CLASS}
                    >
                        <option value="">All time</option>
                        <option value="this_month">This month</option>
                        <option value="last_month">Last month</option>
                        <option value="this_year">This year</option>
                    </select>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 md:col-span-2 xl:col-span-2">
                        <input
                            type="date"
                            aria-label="Start date"
                            value={filters.startDate}
                            onChange={(e) => {
                                filters.setStartDate(e.target.value);
                                filters.setTimePeriod('');
                            }}
                            className={`${SELECT_CLASS} w-full`}
                        />
                        <span className="flex h-9 items-center justify-center text-text-3 text-sm">
                            to
                        </span>
                        <input
                            type="date"
                            aria-label="End date"
                            value={filters.endDate}
                            onChange={(e) => {
                                filters.setEndDate(e.target.value);
                                filters.setTimePeriod('');
                            }}
                            className={`${SELECT_CLASS} w-full`}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}
