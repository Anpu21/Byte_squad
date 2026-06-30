import { LuTriangleAlert as AlertTriangle, LuCheck as Check } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { cn, formatCurrency } from '@/lib/utils';
import type { ICreditAccountSearchResult, TPaymentMethod } from '@/types';
import type { IPosCreditOverride } from '@/features/pos/hooks/useCreditAttach';

interface IPosCreditTenderPanelProps {
  method: TPaymentMethod;
  onMethodChange: (method: TPaymentMethod) => void;
  account: ICreditAccountSearchResult;
  amount: number;
  override: IPosCreditOverride | null;
  onRequestOverride: () => void;
}

/**
 * Tender selector shown once a credit account is attached: Cash vs On-credit.
 * In credit mode it previews the charge against the khata (available credit,
 * new balance, due date) and gates over-limit sales behind a manager override.
 */
export function PosCreditTenderPanel({
  method,
  onMethodChange,
  account,
  amount,
  override,
  onRequestOverride,
}: IPosCreditTenderPanelProps) {
  const onCredit = method === 'Credit';
  const available = account.availableCredit;
  const overLimit = available !== null && amount > available;
  const hasValidOverride =
    override !== null && override.amount + 0.001 >= amount;
  const needsOverride = overLimit && !hasValidOverride;
  const newBalance = account.currentBalance + amount;

  return (
    <section
      aria-label="Payment method"
      className="bg-surface border border-border-strong rounded-lg p-4 flex flex-col gap-3"
    >
      <div
        role="group"
        aria-label="Tender method"
        className="grid grid-cols-2 gap-1 p-1 bg-surface-2 rounded-md"
      >
        <TenderTab
          active={!onCredit}
          label="Cash"
          onClick={() => onMethodChange('Cash')}
        />
        <TenderTab
          active={onCredit}
          label="On credit"
          onClick={() => onMethodChange('Credit')}
        />
      </div>

      {onCredit ? (
        <div className="flex flex-col gap-1.5 text-[13px]">
          <Row label={`Charge to ${account.holderName}`}>
            {formatCurrency(amount)}
          </Row>
          <Row label="Available credit">
            {available === null ? '∞ (unlimited)' : formatCurrency(available)}
          </Row>
          <Row label="New balance">{formatCurrency(newBalance)}</Row>
          {account.creditTermDays != null ? (
            <Row label="Due in">{account.creditTermDays} days</Row>
          ) : null}

          {needsOverride ? (
            <div className="mt-1 flex flex-col gap-2 rounded-md border border-warning/40 bg-warning-soft/50 p-2.5">
              <p className="flex items-start gap-1.5 text-[12px] text-warning">
                <AlertTriangle
                  size={14}
                  aria-hidden
                  className="mt-px shrink-0"
                />
                Over the available credit
                {available !== null
                  ? ` by ${formatCurrency(amount - available)}`
                  : ''}
                . A manager must authorize this charge.
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="self-start"
                onClick={onRequestOverride}
              >
                Get manager approval
              </Button>
            </div>
          ) : overLimit && hasValidOverride ? (
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-accent-text">
              <Check size={14} aria-hidden />
              Manager override authorized.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function TenderTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-8 rounded-md text-[13px] font-medium transition-colors',
        active
          ? 'bg-surface text-text-1 shadow-xs'
          : 'text-text-2 hover:text-text-1',
      )}
    >
      {label}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-2">{label}</span>
      <span className="font-medium text-text-1 tabular-nums">{children}</span>
    </div>
  );
}
