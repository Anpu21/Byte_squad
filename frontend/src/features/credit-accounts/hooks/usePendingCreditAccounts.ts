import { useCreditAccounts } from './useCreditAccounts';

/** Convenience wrapper for the PENDING approvals inbox. */
export function usePendingCreditAccounts() {
  return useCreditAccounts({ status: 'PENDING' });
}
