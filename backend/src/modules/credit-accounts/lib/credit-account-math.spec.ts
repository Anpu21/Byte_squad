import {
  allocateFifo,
  overdueDays,
} from '@/modules/credit-accounts/lib/credit-account-math';

describe('allocateFifo', () => {
  it('clears the oldest bills first and stops when funds run out', () => {
    const result = allocateFifo(
      [
        { id: 'a', balanceDue: 100 },
        { id: 'b', balanceDue: 100 },
      ],
      120,
    );
    expect(result).toEqual([
      { id: 'a', applied: 100, newDue: 0 },
      { id: 'b', applied: 20, newDue: 80 },
    ]);
  });

  it('partially settles a single bill', () => {
    expect(allocateFifo([{ id: 'a', balanceDue: 100 }], 40)).toEqual([
      { id: 'a', applied: 40, newDue: 60 },
    ]);
  });

  it('caps allocation at the total owed when overpaid', () => {
    const result = allocateFifo([{ id: 'a', balanceDue: 100 }], 250);
    expect(result).toEqual([{ id: 'a', applied: 100, newDue: 0 }]);
  });
});

describe('overdueDays', () => {
  const asOf = new Date('2026-06-28T10:00:00Z');

  it('is 0 when there is no due date', () => {
    expect(overdueDays(null, asOf)).toBe(0);
  });

  it('is 0 when the bill is not yet due', () => {
    expect(overdueDays('2026-07-15', asOf)).toBe(0);
  });

  it('counts whole days past the due date', () => {
    expect(overdueDays('2026-06-18', asOf)).toBe(10);
  });
});
