export const SHIFT_STATUSES = ['Open', 'Closed'] as const;

export type ShiftStatus = (typeof SHIFT_STATUSES)[number];
