import axios from 'axios';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';
import type { ILoyaltyLookupResult } from '@/types';

/**
 * Strip display formatting from a cashier-typed phone string so the
 * backend lookup regex (digits + optional leading `+`) accepts it.
 * Lives in its own helper so the lookup hook and the card test can
 * agree on the canonical normalisation.
 */
export function sanitisePhone(raw: string): string {
    return raw.replace(/[^\d+]/g, '');
}

/**
 * Map the wire-shape `ILoyaltyLookupResult` onto the trimmed
 * `IPosLoyaltyOwner` slot the page persists. Centralised so the lookup and
 * enrol paths produce identical owner objects.
 */
export function toOwner(result: ILoyaltyLookupResult): IPosLoyaltyOwner {
    return {
        ownerType: result.ownerType,
        userId: result.userId,
        loyaltyCustomerId: result.loyaltyCustomerId,
        tier: result.tier,
        firstName: result.firstName,
        pointsBalance: result.pointsBalance,
    };
}

/**
 * Pull a human-readable error message off whatever the enrol
 * mutation rejected with. Prefers the BadRequestException payload
 * the backend ships, falls back to `error.message`, then to a
 * generic string so the cashier never sees `[object Object]`.
 */
export function extractEnrollError(error: unknown): string | null {
    if (!error) return null;
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | { message?: string | string[] }
            | undefined;
        const msg = data?.message;
        if (Array.isArray(msg)) return msg.join(', ');
        if (typeof msg === 'string') return msg;
    }
    if (error instanceof Error) return error.message;
    return 'Could not enrol customer';
}
