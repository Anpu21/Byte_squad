/**
 * Expiry severity buckets (Phase C1). Mirrors the frontend severity mapping.
 * - expired:  expiry date is in the past
 * - critical: expires within 7 days
 * - warning:  expires within 30 days
 * - ok:       more than 30 days out
 */
export type ExpirySeverity = 'expired' | 'critical' | 'warning' | 'ok';
