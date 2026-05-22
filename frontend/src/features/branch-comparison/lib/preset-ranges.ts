export type PresetKey = '7d' | '30d' | '90d' | 'mtd' | 'custom';

export const PRESET_LABELS: Record<PresetKey, string> = {
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
    mtd: 'This month',
    custom: 'Custom',
};

export const PRESET_ORDER: PresetKey[] = ['7d', '30d', '90d', 'mtd', 'custom'];

export function resolvePreset(
    key: PresetKey,
): { start: Date; end: Date } | null {
    if (key === 'custom') return null;
    const end = new Date();
    const start = new Date();
    if (key === '7d') start.setDate(end.getDate() - 6);
    else if (key === '30d') start.setDate(end.getDate() - 29);
    else if (key === '90d') start.setDate(end.getDate() - 89);
    else if (key === 'mtd') start.setDate(1);
    return { start, end };
}
