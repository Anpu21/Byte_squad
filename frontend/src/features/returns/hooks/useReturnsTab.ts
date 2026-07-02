import { useTabParam } from '@/hooks/useTabParam';

export type ReturnsTab = 'list' | 'analytics';

/**
 * URL-synced active tab for the Returns hub, clamped to the role-allowed keys
 * (a deep-link to a hidden tab falls back to the first allowed one). The
 * sidebar panel's nested sub-tabs write the same `?tab=` param.
 */
export function useReturnsTab(allowed: ReturnsTab[]) {
    return useTabParam<ReturnsTab>({
        valid: allowed.length > 0 ? allowed : ['list'],
        fallback: allowed[0] ?? 'list',
    });
}
