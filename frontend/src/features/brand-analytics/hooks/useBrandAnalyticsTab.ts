import { useTabParam } from '@/hooks/useTabParam'

export type BrandAnalyticsTab = 'brands' | 'by-category' | 'by-branch' | 'manage'

/**
 * URL-synced active tab for the Brand analysis hub, clamped to the role-allowed
 * keys (so a deep-link to a hidden tab falls back to the first allowed one).
 * The sidebar panel's nested sub-tabs write the same `?tab=` param.
 */
export function useBrandAnalyticsTab(allowed: BrandAnalyticsTab[]) {
  return useTabParam<BrandAnalyticsTab>({
    valid: allowed.length > 0 ? allowed : ['brands'],
    fallback: allowed[0] ?? 'brands',
  })
}
