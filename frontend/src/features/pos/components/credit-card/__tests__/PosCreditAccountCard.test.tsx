import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ICreditAccountSearchResult } from '@/types';

// Control the typeahead result set per test.
const mockSearch = vi.hoisted(() => vi.fn());
vi.mock('@/features/pos/hooks/usePosCreditSearch', () => ({
  usePosCreditSearch: (q: string) => mockSearch(q),
}));

// Stub the enroll form so we can assert it mounts with the prefilled phone/name
// without pulling in the mutation hook / toast.
vi.mock('../PosCreditEnrollForm', () => ({
  PosCreditEnrollForm: (props: {
    defaultHolderName: string;
    defaultPhone: string;
  }) => (
    <div data-testid="enroll-form">
      {`form|${props.defaultHolderName}|${props.defaultPhone}`}
    </div>
  ),
}));

import { PosCreditAccountCard } from '../PosCreditAccountCard';

const IDLE = { data: undefined, isFetching: false, isError: false };

const ACCOUNT = {
  id: 'acc-1',
  holderName: 'Nimal Perera',
  phone: '0771234567',
  accountNo: 'CA-001',
  availableCredit: 5000,
  creditTermDays: 30,
} as ICreditAccountSearchResult;

beforeEach(() => {
  mockSearch.mockReturnValue(IDLE);
});

afterEach(() => {
  vi.useRealTimers();
});

const noop = () => {};

describe('PosCreditAccountCard', () => {
  it('defaults to Search mode: shows the search field + toggle, no enroll form', () => {
    render(
      <PosCreditAccountCard
        creditAccount={null}
        onAttach={noop}
        onDetach={noop}
      />,
    );
    expect(
      screen.getByRole('searchbox'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    expect(screen.queryByTestId('enroll-form')).toBeNull();
  });

  it('switching to Register via the toggle shows the enroll form', async () => {
    const user = userEvent.setup();
    render(
      <PosCreditAccountCard
        creditAccount={null}
        onAttach={noop}
        onDetach={noop}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByTestId('enroll-form')).toBeInTheDocument();
  });

  it('on a search miss, the CTA switches to Register with the phone prefilled', async () => {
    // Real timers: let the 350ms debounce settle and poll for the CTA.
    mockSearch.mockReturnValue({ data: [], isFetching: false, isError: false });
    const user = userEvent.setup();
    render(
      <PosCreditAccountCard
        creditAccount={null}
        onAttach={noop}
        onDetach={noop}
      />,
    );

    await user.type(screen.getByRole('searchbox'), '0771234567');

    const cta = await screen.findByRole(
      'button',
      { name: /register this customer/i },
      { timeout: 2000 },
    );
    await user.click(cta);

    expect(screen.getByTestId('enroll-form')).toHaveTextContent(
      'form||0771234567',
    );
  });

  it('when an account is attached, hides the toggle and shows the summary + Clear', () => {
    render(
      <PosCreditAccountCard
        creditAccount={ACCOUNT}
        onAttach={noop}
        onDetach={noop}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull();
    expect(screen.getByText('Nimal Perera')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /detach credit account/i }),
    ).toBeInTheDocument();
  });
});
