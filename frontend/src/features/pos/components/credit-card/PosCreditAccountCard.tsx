import { useEffect, useState } from 'react';
import {
  LuNotebookTabs as NotebookTabs,
  LuX as X,
  LuLoaderCircle as Loader2,
  LuSearch as Search,
} from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Pill from '@/components/ui/Pill';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountSearchResult } from '@/types';
import { usePosCreditSearch } from '@/features/pos/hooks/usePosCreditSearch';
import { PosCreditEnrollForm } from './PosCreditEnrollForm';
import { sanitisePhone } from './pos-credit-card.helpers';

const DEBOUNCE_MS = 350;
const MAX_RESULTS = 6;

export interface IPosCreditAccountCardProps {
  creditAccount: ICreditAccountSearchResult | null;
  onAttach: (account: ICreditAccountSearchResult) => void;
  onDetach: () => void;
}

/**
 * Cashier-side credit-account attach card. Typeahead over ACTIVE accounts in
 * the cashier's branch (by phone/name/account no); pick one to fund a
 * buy-on-credit sale, or — on a miss — enroll the walk-in via the inline form,
 * which sends a PENDING request to the manager.
 */
export function PosCreditAccountCard({
  creditAccount,
  onAttach,
  onDetach,
}: IPosCreditAccountCardProps) {
  const [queryRaw, setQueryRaw] = useState('');
  const debounced = useDebouncedValue(queryRaw, DEBOUNCE_MS);
  const search = usePosCreditSearch(debounced);

  const results = search.data ?? [];
  const isSearching = search.isFetching && !search.data;
  const showMiss =
    !creditAccount &&
    debounced.trim().length >= 2 &&
    search.data !== undefined &&
    results.length === 0 &&
    !search.isFetching;

  const handleClear = () => {
    onDetach();
    setQueryRaw('');
  };

  return (
    <section
      aria-label="Store credit"
      className="bg-surface border border-border-strong rounded-lg p-4 flex flex-col gap-3"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotebookTabs size={16} aria-hidden className="text-primary" />
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-text-2">
            Store credit
            <span className="ml-1.5 normal-case font-normal text-text-3">
              (optional)
            </span>
          </h2>
        </div>
        {creditAccount ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            aria-label="Detach credit account"
          >
            <X size={14} aria-hidden />
            Clear
          </Button>
        ) : null}
      </header>

      {creditAccount ? (
        <CreditHitBody account={creditAccount} />
      ) : (
        <>
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
              {results.slice(0, MAX_RESULTS).map((acc) => (
                <li key={acc.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onAttach(acc);
                      setQueryRaw('');
                    }}
                    className="w-full flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left hover:border-focus hover:bg-surface-2/50 transition-colors"
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
              ))}
            </ul>
          ) : null}

          {search.isError ? (
            <p role="alert" className="text-[11px] text-danger">
              Could not search credit accounts. Try again.
            </p>
          ) : null}

          {showMiss ? (
            <PosCreditEnrollForm
              key={debounced}
              defaultHolderName={/[a-z]/i.test(debounced) ? debounced.trim() : ''}
              defaultPhone={sanitisePhone(debounced)}
              onEnrolled={() => setQueryRaw('')}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function CreditHitBody({ account }: { account: ICreditAccountSearchResult }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-text-1">
            {account.holderName}
          </span>
          <span className="text-[11px] text-text-3">
            {account.phone} · {account.accountNo}
          </span>
        </div>
        <Pill tone="success">Active</Pill>
      </div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-text-2">Available credit</span>
        <span className="font-semibold text-text-1 tabular-nums">
          {account.availableCredit === null
            ? '∞ (unlimited)'
            : formatCurrency(account.availableCredit)}
        </span>
      </div>
      {account.creditTermDays != null ? (
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-2">Repayment term</span>
          <span className="text-text-1">{account.creditTermDays} days</span>
        </div>
      ) : null}
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
