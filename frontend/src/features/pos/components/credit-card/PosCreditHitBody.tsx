import Pill from '@/components/ui/Pill';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountSearchResult } from '@/types';

/** Read-only summary of the attached credit account (name, available, term). */
export function PosCreditHitBody({
  account,
}: {
  account: ICreditAccountSearchResult;
}) {
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
