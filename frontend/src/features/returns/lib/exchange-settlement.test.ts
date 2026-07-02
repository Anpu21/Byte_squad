import { describe, expect, it } from 'vitest'
import {
  buildExchangePayment,
  exchangeCashChange,
  settleExchange,
} from './exchange-settlement'

describe('settleExchange', () => {
  it('classifies an even swap (no money)', () => {
    expect(settleExchange(1000, 1000)).toEqual({
      diff: 0,
      kind: 'even',
      amount: 0,
    })
  })

  it('classifies a dearer swap (customer pays the difference)', () => {
    expect(settleExchange(490, 2200)).toEqual({
      diff: 1710,
      kind: 'pay',
      amount: 1710,
    })
  })

  it('classifies a cheaper swap (refund the difference)', () => {
    expect(settleExchange(6710, 2200)).toEqual({
      diff: -4510,
      kind: 'refund',
      amount: 4510,
    })
  })

  it('treats sub-cent differences as even (float tolerance)', () => {
    expect(settleExchange(100, 100.004).kind).toBe('even')
  })
})

describe('buildExchangePayment', () => {
  it('returns undefined for even/refund (no money in)', () => {
    expect(
      buildExchangePayment(settleExchange(1000, 1000), 'Cash', 0),
    ).toBeUndefined()
    expect(
      buildExchangePayment(settleExchange(6710, 2200), 'Cash', 0),
    ).toBeUndefined()
  })

  it('builds a cash upcharge with the tendered amount', () => {
    expect(
      buildExchangePayment(settleExchange(490, 2200), 'Cash', 2000),
    ).toEqual({
      paymentMethod: 'Cash',
      paymentAmount: 1710,
      cashAmount: 1710,
      cashTendered: 2000,
    })
  })

  it('builds a card upcharge (amount only, no cash fields)', () => {
    expect(
      buildExchangePayment(settleExchange(490, 2200), 'Card', 0),
    ).toEqual({ paymentMethod: 'Card', paymentAmount: 1710 })
  })
})

describe('exchangeCashChange', () => {
  it('computes change for a cash upcharge', () => {
    expect(exchangeCashChange(settleExchange(490, 2200), 'Cash', 2000)).toBe(290)
  })

  it('is 0 for card, refund, or even', () => {
    expect(exchangeCashChange(settleExchange(490, 2200), 'Card', 0)).toBe(0)
    expect(exchangeCashChange(settleExchange(6710, 2200), 'Cash', 0)).toBe(0)
    expect(exchangeCashChange(settleExchange(100, 100), 'Cash', 500)).toBe(0)
  })
})
