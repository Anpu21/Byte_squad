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
    /** Cashier/manager branch-scoped loyalty member list. */
    branchMembers: (params: {
        search?: string;
        limit?: number;
        offset?: number;
    }) => ['loyalty', 'branch-members', params] as const,
    /** One branch member's points ledger, keyed on the list row id. */
    memberHistory: (id: string, params: { limit?: number; offset?: number }) =>
        ['loyalty', 'member-history', id, params] as const,
} as const;
