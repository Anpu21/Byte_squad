import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ICreditAccountRow, CreditAccountStatus } from '@/types';
import { PendingApprovalsTable } from '../components/PendingApprovalsTable';
import { CreditAccountsTable } from '../components/CreditAccountsTable';
import { CreditAccountStatusPill } from '../components/CreditAccountStatusPill';
import { CreditAccountsKpis } from '../components/CreditAccountsKpis';

function makeRow(overrides: Partial<ICreditAccountRow> = {}): ICreditAccountRow {
  return {
    id: 'acc-1',
    accountNo: 'KH-AAAA1111',
    holderName: 'Asha Perera',
    phone: '0771234567',
    nic: null,
    branchId: 'branch-1',
    branchName: 'Main',
    status: 'ACTIVE',
    creditLimit: 5000,
    creditTermDays: 30,
    currentBalance: 1200,
    availableCredit: 3800,
    requestedCreditLimit: 4000,
    requestNote: null,
    approvalNote: null,
    rejectionReason: null,
    requestedByUserId: 'cashier-1',
    requestedByName: 'Nimal Cashier',
    reviewedByName: null,
    reviewedAt: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    ageing: {
      notDue: 700,
      d1to30: 500,
      d31to60: 0,
      d61to90: 0,
      d90plus: 0,
      overdueTotal: 500,
      outstandingTotal: 1200,
    },
    ...overrides,
  };
}

describe('PendingApprovalsTable', () => {
  it('renders a pending request and wires the approve/reject actions', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const row = makeRow({ status: 'PENDING' });

    render(
      <PendingApprovalsTable
        rows={[row]}
        isLoading={false}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    expect(screen.getByText('Asha Perera')).toBeInTheDocument();
    expect(screen.getByText('Nimal Cashier')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith(row);

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(onReject).toHaveBeenCalledWith(row);
  });

  it('shows an empty state with no requests', () => {
    render(
      <PendingApprovalsTable
        rows={[]}
        isLoading={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByText('No pending requests')).toBeInTheDocument();
  });
});

describe('CreditAccountsTable', () => {
  it('renders an account and opens its statement', async () => {
    const user = userEvent.setup();
    const onOpenStatement = vi.fn();
    const row = makeRow();

    render(
      <CreditAccountsTable
        rows={[row]}
        isLoading={false}
        onOpenStatement={onOpenStatement}
      />,
    );

    expect(screen.getByText('Asha Perera')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Statement' }));
    expect(onOpenStatement).toHaveBeenCalledWith(row);
  });
});

describe('CreditAccountStatusPill', () => {
  it.each<[CreditAccountStatus, string]>([
    ['PENDING', 'Pending'],
    ['ACTIVE', 'Active'],
    ['REJECTED', 'Rejected'],
    ['SUSPENDED', 'Suspended'],
    ['CLOSED', 'Closed'],
  ])('maps %s to the %s label', (status, label) => {
    render(<CreditAccountStatusPill status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('CreditAccountsKpis', () => {
  it('summarizes outstanding, overdue, and account counts', () => {
    const rows = [
      makeRow({ id: 'a', status: 'ACTIVE' }),
      makeRow({ id: 'b', status: 'PENDING' }),
    ];
    render(<CreditAccountsKpis rows={rows} isLoading={false} />);

    expect(screen.getByText('Outstanding')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Active accounts')).toBeInTheDocument();
    expect(screen.getByText('Pending approvals')).toBeInTheDocument();
  });
});
