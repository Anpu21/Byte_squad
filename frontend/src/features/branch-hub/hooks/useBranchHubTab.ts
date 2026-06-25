import { useTabParam } from '@/hooks/useTabParam';

export type BranchHubTab = 'overview' | 'compare';

const VALID_TABS = ['overview', 'compare'] as const;

/** URL-synced Branch-hub tab state. Thin wrapper over the shared {@link useTabParam}. */
export function useBranchHubTab() {
    return useTabParam<BranchHubTab>({
        valid: VALID_TABS,
        fallback: 'overview',
    });
}
