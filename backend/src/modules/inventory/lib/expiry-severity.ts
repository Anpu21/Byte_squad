import { ExpirySeverity } from '@inventory/types/expiry-severity.type';

export const EXPIRY_CRITICAL_DAYS = 7;
export const EXPIRY_WARNING_DAYS = 30;

/**
 * Whole days from `now` until `expiryDate` (negative once expired). Computed on
 * the calendar-day boundary so a batch expiring "today" reads as 0, not -0.x.
 */
export function daysToExpiry(expiryDate: string | Date, now: Date): number {
  const expiry = new Date(expiryDate);
  const startOfExpiry = Date.UTC(
    expiry.getUTCFullYear(),
    expiry.getUTCMonth(),
    expiry.getUTCDate(),
  );
  const startOfNow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfExpiry - startOfNow) / MS_PER_DAY);
}

/** Bucket a days-to-expiry value into a severity (Phase C1 thresholds). */
export function severityForDays(days: number): ExpirySeverity {
  if (days < 0) return 'expired';
  if (days <= EXPIRY_CRITICAL_DAYS) return 'critical';
  if (days <= EXPIRY_WARNING_DAYS) return 'warning';
  return 'ok';
}
