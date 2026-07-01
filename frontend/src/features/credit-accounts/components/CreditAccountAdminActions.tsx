import Button from '@/components/ui/Button';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface CreditAccountAdminActionsProps {
  isActive: boolean;
  creditLimit: number | null;
  creditTermDays: number | null;
  limitDraft: string;
  onLimitDraftChange: (value: string) => void;
  termDraft: string;
  onTermDraftChange: (value: string) => void;
  savePending: boolean;
  onSaveLimitTerm: () => void;
  suspendPending: boolean;
  onSuspend: () => void;
  closePending: boolean;
  onCloseAccount: () => void;
}

/** Credit-limit / term edits plus the suspend + close lifecycle actions. */
export function CreditAccountAdminActions({
  isActive,
  creditLimit,
  creditTermDays,
  limitDraft,
  onLimitDraftChange,
  termDraft,
  onTermDraftChange,
  savePending,
  onSaveLimitTerm,
  suspendPending,
  onSuspend,
  closePending,
  onCloseAccount,
}: CreditAccountAdminActionsProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      {isActive && (
        <>
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-wide text-text-3">
              Credit limit
            </span>
            <input
              className={`${INPUT_CLASS} w-32 text-right`}
              type="number"
              min="1"
              step="0.01"
              value={limitDraft}
              onChange={(e) => onLimitDraftChange(e.target.value)}
              placeholder={creditLimit === null ? 'unlimited' : String(creditLimit)}
              aria-label="Credit limit"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-wide text-text-3">
              Term (days)
            </span>
            <input
              className={`${INPUT_CLASS} w-24 text-right`}
              type="number"
              min="1"
              max="365"
              step="1"
              value={termDraft}
              onChange={(e) => onTermDraftChange(e.target.value)}
              placeholder={creditTermDays === null ? '—' : String(creditTermDays)}
              aria-label="Repayment term in days"
            />
          </label>
          <Button
            size="sm"
            variant="secondary"
            disabled={savePending || (limitDraft === '' && termDraft === '')}
            onClick={onSaveLimitTerm}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={suspendPending}
            onClick={onSuspend}
          >
            Suspend
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-danger"
        disabled={closePending}
        onClick={onCloseAccount}
      >
        Close account
      </Button>
    </div>
  );
}
