/**
 * Categorical series palette for multi-series charts (donuts, multi-line
 * trends, grouped bars). Brand-token based so light/dark recolour
 * automatically — never hardcode hex. The order is stable so a series keeps
 * its colour across widgets (e.g. a branch reads the same colour in the
 * revenue trend and the revenue-by-branch donut).
 */
export const CHART_COLORS = [
    'var(--primary)',
    'var(--accent)',
    'var(--warning)',
    'var(--info)',
    'var(--danger)',
    'var(--brand-400)',
] as const;
