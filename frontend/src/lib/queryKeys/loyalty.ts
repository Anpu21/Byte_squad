export const loyalty = {
    mine: () => ['loyalty', 'mine'] as const,
    history: (params: { limit?: number; offset?: number }) =>
        ['loyalty', 'history', params] as const,
    settings: () => ['loyalty', 'settings'] as const,
    /**
     * Cashier-side phone lookup. Keyed on the normalised phone so
     * a successful enrol can invalidate the exact pending query and
     * transition the card from miss → hit without a manual refetch.
     */
    posLookup: (phone: string) =>
        ['loyalty', 'pos-lookup', phone] as const,
} as const;
