import { describe, expect, it } from 'vitest'
import { formatCurrency, formatCurrencyWhole } from './utils'

describe('formatCurrency', () => {
  it('formats an amount in LKR by default', () => {
    // Non-breaking spaces vary by ICU build; assert the parts that matter.
    const out = formatCurrency(1234.5)
    expect(out).toContain('1,234.50')
    expect(out).toMatch(/LKR|Rs/)
  })

  it('does not throw when a non-string currency is passed (charting-lib footgun)', () => {
    // recharts invokes tickFormatter(value, index) — index (a number) would
    // otherwise land in `currency` and throw "Invalid currency code".
    expect(() => formatCurrency(100, 4 as unknown as string)).not.toThrow()
    expect(formatCurrency(100, 4 as unknown as string)).toContain('100')
  })

  it('falls back to LKR for an invalid currency code', () => {
    expect(() =>
      formatCurrency(100, 'not-a-code' as unknown as string),
    ).not.toThrow()
    expect(() => formatCurrencyWhole(100, '' as unknown as string)).not.toThrow()
  })
})
