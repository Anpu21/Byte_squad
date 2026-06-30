/**
 * Stable chart-slice colours for brands that don't have an explicit `color`.
 * Assigned by insertion order (seed + auto-create) so a brand keeps the same
 * hue across the leaderboard bar, donut, and chip. The frontend may still fall
 * back to its own palette when a brand row carries a null colour.
 */
export const BRAND_PALETTE: readonly string[] = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#3b82f6', // blue
];

export function pickBrandColor(index: number): string {
  return BRAND_PALETTE[index % BRAND_PALETTE.length];
}
