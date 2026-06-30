import { useCreditAccounts } from './useCreditAccounts';

/** Convenience wrapper for the PENDING approvals inbox. */
export function usePendingCreditAccounts(options?: { enabled?: boolean }) {
  return useCreditAccounts({ status: 'PENDING' }, options);
}
