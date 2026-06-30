import { useMutation } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import type { IAuthorizeOverridePayload } from '@/types';

/**
 * `POST /credit-accounts/authorize-override` — a manager authorizes an
 * over-limit charge at the counter; returns a short-lived token the checkout
 * passes back. No cache to invalidate (the token is consumed by the sale).
 */
export function useAuthorizeCreditOverride() {
  return useMutation({
    mutationFn: (payload: IAuthorizeOverridePayload) =>
      creditAccountsService.authorizeOverride(payload),
  });
}
