import { LuSearch as Search } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { LedgerFiltersState } from '../hooks/useLedgerFilters';
import type {
    LedgerAccountType,
    LedgerEntryType,
    LedgerTimePeriod,
} from '../types/filters.type';

const SELECT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface LedgerFiltersProps {
    filters: LedgerFiltersState;
}

export function LedgerFilters({ filters }: LedgerFiltersProps) {
    return (
        <Card className="p-4 mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                    />
                    <label htmlFor="ledger-search" className="sr-only">
                        Search ledger
                    </label>
                    <input
                        id="ledger-search"
                        type="text"
                        value={filters.search}
                        onChange={(e) => filters.setSearch(e.target.value)}
                        placeholder="Search description or reference…"
                        className={`${FIELD_SHELL} ${FIELD_BORDER} w-full h-9 pl-9 pr-3`}
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
                    <input
                        type="date"
                        aria-label="Start date"
                        value={filters.startDate}
                        onChange={(e) => {
                            filters.setStartDate(e.target.value);
                            filters.setTimePeriod('');
                        }}
                        className={SELECT_CLASS}
                    />
                    <span className="text-text-3 text-sm">to</span>
                    <input
                        type="date"
                        aria-label="End date"
                        value={filters.endDate}
                        onChange={(e) => {
                            filters.setEndDate(e.target.value);
                            filters.setTimePeriod('');
                        }}
                        className={SELECT_CLASS}
                    />
                </div>
            </div>
        </Card>
    );
}
