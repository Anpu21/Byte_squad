import { normalizeSriLankaPhone } from '@common/utils/phone.util';

/**
 * `customerKey` — the stable, URL-safe identity used across the customer hub.
 *
 * There is no canonical customers table (identities are stitched by phone), so
 * the key is:
 *   - the normalized SL phone WITHOUT the leading '+' (e.g. `94771234567`),
 *     shared by a registered user / walk-in / khata holder on the same number; or
 *   - `u:<userId>` for a registered user who has no phone on file.
 *
 * Dropping the '+' keeps the key clean inside a URL path segment; `parseCustomerKey`
 * restores it before matching source `phone` columns (which store `+94…`).
 */
const USER_KEY_PREFIX = 'u:';

/** Phone → key (`94…`), or null when the input isn't a valid SL number. */
export function phoneToCustomerKey(phone: unknown): string | null {
  const normalized = normalizeSriLankaPhone(phone);
  return normalized ? normalized.slice(1) : null;
}

export function userCustomerKey(userId: string): string {
  return `${USER_KEY_PREFIX}${userId}`;
}

/** A registered user's key: their phone when valid, else the `u:<id>` fallback. */
export function customerKeyForUser(userId: string, phone?: unknown): string {
  return phoneToCustomerKey(phone) ?? userCustomerKey(userId);
}

export interface ParsedCustomerKey {
  kind: 'phone' | 'user';
  /** Normalized `+94…` phone when `kind === 'phone'`, else null. */
  phone: string | null;
  /** userId when `kind === 'user'`, else null. */
  userId: string | null;
}

export function isUserCustomerKey(key: string): boolean {
  return key.startsWith(USER_KEY_PREFIX);
}

export function parseCustomerKey(key: string): ParsedCustomerKey {
  if (isUserCustomerKey(key)) {
    return {
      kind: 'user',
      phone: null,
      userId: key.slice(USER_KEY_PREFIX.length),
    };
  }
  // A phone key is bare digits (`94…`); restore the '+' and re-validate.
  return {
    kind: 'phone',
    phone: normalizeSriLankaPhone(`+${key}`),
    userId: null,
  };
}
