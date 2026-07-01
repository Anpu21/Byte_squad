import { useEffect, useState } from 'react';
import {
  LuNotebookTabs as NotebookTabs,
  LuSearch as Search,
  LuLoaderCircle as Loader2,
  LuUserPlus as UserPlus,
} from 'react-icons/lu';
import { Button, EmptyState, Input } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountSearchResult } from '@/types';
import { useCreditAccountSearch } from './hooks/useCreditAccountSearch';
import { useCreditAccountStatement } from './hooks/useCreditAccountStatement';
import { useReceiveCreditAccountPayment } from './hooks/useReceiveCreditAccountPayment';
import { CreditAccountStatementView } from './components/CreditAccountStatementView';
import { CashierCreditEnrollModal } from './components/CashierCreditEnrollModal';

const DEBOUNCE_MS = 350;
const MAX_RESULTS = 8;

/**
 * Cashier-facing store-credit ("khata") counter. Search an ACTIVE credit
 * customer in the cashier's branch, view their balance / ledger / unpaid bills,
 * record a FIFO repayment, or enroll a new walk-in. A scoped slice of the
 * admin/manager credit-accounts hub (no approvals, limits, or lifecycle).
 */
export function CashierStoreCreditPage() {
  const [queryRaw, setQueryRaw] = useState('');
  const debounced = useDebouncedValue(queryRaw, DEBOUNCE_MS);
  const search = useCreditAccountSearch(debounced);

  const [selected, setSelected] = useState<ICreditAccountSearchResult | null>(
    null,
  );
  const [enrollOpen, setEnrollOpen] = useState(false);

  const statement = useCreditAccountStatement(selected?.id ?? null);
  const receivePayment = useReceiveCreditAccountPayment();

  const results = search.data ?? [];
  const isSearching = search.isFetching && !search.data;
  const term = debounced.trim();
  const showMiss =
    term.length >= 1 && !isSearching && !search.isError && results.length === 0;
  const stmt = statement.data;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1">
            Store credit
          </h1>
          <p className="text-xs text-text-2 mt-1">
            Look up a customer's tab, take a repayment, or enroll a new walk-in.
          </p>
        </div>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => setEnrollOpen(true)}
        >
          <UserPlus size={16} aria-hidden /> Enroll customer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        {/* Search column */}
        <section
          aria-label="Find a credit customer"
          className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3"
        >
          <Input
            type="search"
            label="Phone or name"
            value={queryRaw}
            onChange={(e) => setQueryRaw(e.target.value)}
            placeholder="Search active credit accounts"
            autoComplete="off"
            leftIcon={<Search size={16} aria-hidden />}
            rightSlot={
              isSearching ? (
                <Loader2
                  size={16}
                  aria-hidden
                  className="animate-spin text-text-3"
                />
              ) : null
            }
            aria-busy={isSearching}
          />

          {results.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {results.slice(0, MAX_RESULTS).map((acc) => {
                const active = acc.id === selected?.id;
                return (
                  <li key={acc.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(acc)}
                      aria-pressed={active}
                      className={`w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                        active
                          ? 'border-focus bg-surface-2/60'
                          : 'border-border hover:border-focus hover:bg-surface-2/50'
                      }`}
                    >
                      <span className="flex flex-col">
                        <span className="text-[13px] font-medium text-text-1">
                          {acc.holderName}
                        </span>
                        <span className="text-[11px] text-text-3">
                          {acc.phone} · {acc.accountNo}
                        </span>
                      </span>
                      <span className="text-[12px] text-text-2 tabular-nums">
                        {acc.availableCredit === null
                          ? '∞'
                          : formatCurrency(acc.availableCredit)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {search.isError ? (
            <p role="alert" className="text-[11px] text-danger">
              Could not search credit accounts. Try again.
            </p>
          ) : null}

          {showMiss ? (
            <p className="text-[11px] text-text-3">
              No active accounts match “{term}”. Use{' '}
              <span className="font-medium text-text-2">Enroll customer</span> to
              send a request to the manager.
            </p>
          ) : null}
        </section>

        {/* Statement column */}
        <section
          aria-label="Account statement"
          className="bg-surface border border-border rounded-lg p-4 min-h-[220px]"
        >
          {selected === null ? (
            <EmptyState
              icon={<NotebookTabs size={26} aria-hidden />}
              title="No customer selected"
              description="Search by phone or name on the left, then pick a customer to see their balance, ledger, and unpaid bills — and to record a repayment."
            />
          ) : (
            <div className="space-y-4">
              <h2 className="text-[18px] font-semibold text-text-1">
                {selected.holderName}
              </h2>
              {statement.isLoading ? (
                <div className="flex items-center justify-center h-[180px]">
                  <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                </div>
              ) : !stmt ? (
                <EmptyState
                  title="Couldn't load this account"
                  description="Something went wrong fetching the statement."
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void statement.refetch()}
                    >
                      Retry
                    </Button>
                  }
                />
              ) : (
                <CreditAccountStatementView
                  statement={stmt}
                  onRecordPayment={(payload) =>
                    receivePayment.mutateAsync({ id: stmt.id, payload })
                  }
                  isRecordingPayment={receivePayment.isPending}
                />
              )}
            </div>
          )}
        </section>
      </div>

      <CashierCreditEnrollModal
        isOpen={enrollOpen}
        onClose={() => setEnrollOpen(false)}
      />
    </div>
  );
}

function useDebouncedValue(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(handle);
  }, [value, ms]);
  return debounced;
}
