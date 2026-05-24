/**
 * Lifecycle state for a Sale row. `Active` is the normal post-checkout
 * state; `Voided` is reached via `POST /pos/sales/:id/void` which also
 * reverses stock movements and credit usage.
 */
export type TSaleStatus = 'Active' | 'Voided';
