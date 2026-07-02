import { useState } from 'react';
import {
  LuNotebookTabs as NotebookTabs,
  LuX as X,
  LuLoaderCircle as Loader2,
  LuSearch as Search,
  LuArrowLeft as ArrowLeft,
  LuUserPlus as UserPlus,
} from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Segmented from '@/components/ui/Segmented';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountSearchResult } from '@/types';
import { usePosCreditSearch } from '@/features/pos/hooks/usePosCreditSearch';
import { useDebouncedValue } from '@/features/pos/hooks/useDebouncedValue';
import { PosCreditEnrollForm } from './PosCreditEnrollForm';
import { PosCreditHitBody } from './PosCreditHitBody';
import { sanitisePhone } from './pos-credit-card.helpers';

const DEBOUNCE_MS = 350;
const MAX_RESULTS = 6;

type CreditMode = 'search' | 'register';

export interface IPosCreditAccountCardProps {
  creditAccount: ICreditAccountSearchResult | null;
  onAttach: (account: ICreditAccountSearchResult) => void;
  onDetach: () => void;
}

/**
 * Cashier-side credit-account card with two modes:
 *  - **Search**: typeahead over ACTIVE accounts in the cashier's branch (by
 *    phone/name/account no); pick one to fund a buy-on-credit sale.
 *  - **Register**: capture a walk-in's details and send a PENDING request to
 *    the manager (the cashier can't set the limit; the manager approves it).
 *
 * A segmented toggle switches modes; on a search miss a one-tap CTA jumps to
 * Register with the typed phone/name prefilled. When an account is attached the
 * toggle is replaced by the account summary + a Clear action.
 */
export function PosCreditAccountCard({
  creditAccount,
  onAttach,
  onDetach,
}: IPosCreditAccountCardProps) {
  const [mode, setMode] = useState<CreditMode>('search');
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

  // Prefill for Register mode, derived from whatever the cashier last typed.
  const prefillName = /[a-z]/i.test(queryRaw) ? queryRaw.trim() : '';
  const prefillPhone = sanitisePhone(queryRaw);

  const handleClear = () => {
    onDetach();
    setQueryRaw('');
    setMode('search');
  };

  const goToRegister = () => setMode('register');
  const backToSearch = () => setMode('search');

  const afterEnrolled = () => {
    setQueryRaw('');
    setMode('search');
  };

  return (
    <section
      aria-label="Store credit"
      className="bg-surface border border-border-strong rounded-lg p-4 flex flex-col gap-3"
    >
      <header className="flex items-center justify-between gap-2">
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
        ) : (
          <Segmented<CreditMode>
            value={mode}
            onChange={setMode}
            size="sm"
            options={[
              { label: 'Search', value: 'search' },
              { label: 'Register', value: 'register' },
            ]}
          />
        )}
      </header>

      {creditAccount ? (
        <PosCreditHitBody account={creditAccount} />
      ) : mode === 'search' ? (
        <>
          <Input
            type="search"
            label="Phone or name"
            value={queryRaw}
            onChange={(e) => setQueryRaw(e.target.value)}
            placeholder="Search by phone or name"
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
            <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-surface-2/40 px-3 py-3">
              <p className="text-[11px] text-text-2">
                No active credit account found for “{debounced.trim()}”.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={goToRegister}
                className="self-start"
              >
                <UserPlus size={14} aria-hidden />
                Register this customer
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={backToSearch}
            className="flex items-center gap-1 self-start text-[11px] font-medium text-text-3 hover:text-text-1 transition-colors focus:outline-none focus-visible:ring-[2px] focus-visible:ring-focus/30 rounded-sm"
          >
            <ArrowLeft size={12} aria-hidden />
            Back to search
          </button>
          <PosCreditEnrollForm
            key={`register:${prefillName}:${prefillPhone}`}
            defaultHolderName={prefillName}
            defaultPhone={prefillPhone}
            onEnrolled={afterEnrolled}
          />
        </div>
      )}
    </section>
  );
}
