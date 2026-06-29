import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ICreditAccountStatement } from '@/types';
import { CreditAccountStatementView } from '../components/CreditAccountStatementView';

function makeStatement(
  overrides: Partial<ICreditAccountStatement> = {},
): ICreditAccountStatement {
  return {
    id: 'acc-1',
    accountNo: 'KH-AAAA1111',
    holderName: 'Asha Perera',
    phone: '0771234567',
    nic: null,
    address: null,
    branchId: 'branch-1',
    branchName: 'Main',
    status: 'ACTIVE',
    creditLimit: 5000,
    creditTermDays: 30,
    currentBalance: 1200,
    availableCredit: 3800,
    ageing: {
      notDue: 700,
      d1to30: 500,
      d31to60: 0,
      d61to90: 0,
      d90plus: 0,
      overdueTotal: 500,
      outstandingTotal: 1200,
    },
    transactions: [
      {
        id: 't1',
        transactionType: 'Credit_Taken',
        amount: 1200,
        runningBalance: 1200,
        referenceNo: 'CR-INV-1',
        notes: null,
        saleId: 's1',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ],
    outstandingSales: [
      {
        saleId: 's1',
        invoiceNumber: 'INV-1',
        total: 1200,
        balanceDue: 1200,
        dueDate: '2026-06-10',
        createdAt: '2026-06-01T00:00:00.000Z',
        overdueDays: 5,
        isOverdue: true,
      },
    ],
    ...overrides,
  };
}

describe('CreditAccountStatementView', () => {
  it('renders the status, unpaid bills, and ledger', () => {
    render(<CreditAccountStatementView statement={makeStatement()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Unpaid bills')).toBeInTheDocument();
    expect(screen.getByText('INV-1')).toBeInTheDocument();
    expect(screen.getByText('Ledger')).toBeInTheDocument();
    expect(screen.getByText('CR-INV-1')).toBeInTheDocument();
  });

  it('submits a repayment with the typed amount and selected method', async () => {
    const user = userEvent.setup();
    const onRecordPayment = vi
      .fn()
      .mockResolvedValue(makeStatement({ currentBalance: 200 }));
    render(
      <CreditAccountStatementView
        statement={makeStatement()}
        onRecordPayment={onRecordPayment}
      />,
    );

    await user.type(screen.getByLabelText('Payment amount'), '1000');
    await user.click(screen.getByRole('button', { name: 'Record' }));

    expect(onRecordPayment).toHaveBeenCalledWith({
      amount: 1000,
      method: 'Cash',
      notes: undefined,
    });
  });

  it('hides the repayment form once the balance is cleared', () => {
    render(
      <CreditAccountStatementView
        statement={makeStatement({ currentBalance: 0 })}
        onRecordPayment={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Record' }),
    ).not.toBeInTheDocument();
  });

  it('is read-only when no repayment handler is supplied', () => {
    render(<CreditAccountStatementView statement={makeStatement()} />);
    expect(screen.queryByLabelText('Payment amount')).not.toBeInTheDocument();
  });
});
