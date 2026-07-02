import Segmented from '@/components/ui/Segmented'
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  exchangeCashChange,
  settleExchange,
  type ExchangeTenderMethod,
} from '../lib/exchange-settlement'

interface IExchangeSettlementPanelProps {
  returnedValue: number
  replacementValue: number
  method: ExchangeTenderMethod
  onMethodChange: (method: ExchangeTenderMethod) => void
  cashTendered: number
  onCashTenderedChange: (value: number) => void
}

const METHOD_OPTIONS: { label: string; value: ExchangeTenderMethod }[] = [
  { label: 'Cash', value: 'Cash' },
  { label: 'Card', value: 'Card' },
]

/**
 * Shows the net-cash settlement of an exchange (Returned vs Replacement) and,
 * for a dearer swap, collects the upcharge tender. Mirrors the server's
 * resolveSettlement; the parent decides submit-validity from the same values.
 */
export function ExchangeSettlementPanel({
  returnedValue,
  replacementValue,
  method,
  onMethodChange,
  cashTendered,
  onCashTenderedChange,
}: IExchangeSettlementPanelProps) {
  const settlement = settleExchange(returnedValue, replacementValue)
  const change = exchangeCashChange(settlement, method, cashTendered)
  const short =
    settlement.kind === 'pay' &&
    method === 'Cash' &&
    cashTendered < settlement.amount

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface-2 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-3">Returned value</span>
        <span className="num text-text-1">{formatCurrency(returnedValue)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-3">Replacement value</span>
        <span className="num text-text-1">
          {formatCurrency(replacementValue)}
        </span>
      </div>

      {settlement.kind === 'even' && (
        <p className="rounded-md bg-accent-soft px-3 py-2 text-sm font-medium text-accent-text">
          Even swap — no money changes hands.
        </p>
      )}

      {settlement.kind === 'refund' && (
        <div className="flex items-center justify-between rounded-md bg-focus-soft px-3 py-2 text-sm font-semibold text-focus">
          <span>Refund to customer (cash)</span>
          <span className="num">{formatCurrency(settlement.amount)}</span>
        </div>
      )}

      {settlement.kind === 'pay' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold text-text-1">
            <span>Customer pays</span>
            <span className="num">{formatCurrency(settlement.amount)}</span>
          </div>
          <Segmented
            value={method}
            options={METHOD_OPTIONS}
            onChange={onMethodChange}
            size="sm"
          />
          {method === 'Cash' && (
            <>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-text-3">Cash tendered</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  aria-label="Cash tendered"
                  value={cashTendered || ''}
                  onChange={(e) =>
                    onCashTenderedChange(Number(e.target.value) || 0)
                  }
                  className={`${FIELD_SHELL} ${FIELD_BORDER} w-28 text-right`}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-3">Change</span>
                <span className="num text-text-1">{formatCurrency(change)}</span>
              </div>
            </>
          )}
          {short && (
            <p className="text-sm font-medium text-danger">
              Cash tendered is less than the amount due.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
