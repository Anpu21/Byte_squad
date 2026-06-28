import { useCallback, useState } from 'react';
import type { ICreditAccountSearchResult } from '@/types';

/**
 * A manager's authorization to charge over the account's available credit.
 * `amount` is the bill total the token was minted for — if the cart grows past
 * it, the cashier must re-authorize (the backend caps the token).
 */
export interface IPosCreditOverride {
  token: string;
  amount: number;
}

export interface IUseCreditAttachReturn {
  creditAccount: ICreditAccountSearchResult | null;
  setCreditAccount: (account: ICreditAccountSearchResult | null) => void;
  creditOverride: IPosCreditOverride | null;
  setCreditOverride: (override: IPosCreditOverride | null) => void;
  /** Called by `usePosPageState.resetAfterCheckout` to clear both slots. */
  resetCredit: () => void;
}

/**
 * Owns the cashier's buy-on-credit attach state for the active sale: the
 * resolved khata account and any manager over-limit override. Mirrors
 * `useLoyaltyAttach` so each slot stays small and the credit card reads the
 * same shape the page uses to build the create-sale payload.
 */
export function useCreditAttach(): IUseCreditAttachReturn {
  const [creditAccount, setCreditAccountRaw] =
    useState<ICreditAccountSearchResult | null>(null);
  const [creditOverride, setCreditOverride] =
    useState<IPosCreditOverride | null>(null);

  // Attaching or detaching an account invalidates any prior override — the
  // token was minted for one specific account.
  const setCreditAccount = useCallback(
    (account: ICreditAccountSearchResult | null) => {
      setCreditAccountRaw(account);
      setCreditOverride(null);
    },
    [],
  );

  const resetCredit = useCallback(() => {
    setCreditAccountRaw(null);
    setCreditOverride(null);
  }, []);

  return {
    creditAccount,
    setCreditAccount,
    creditOverride,
    setCreditOverride,
    resetCredit,
  };
}
