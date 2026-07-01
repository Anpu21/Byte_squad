import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

export const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

export const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export const REPORT_TABS = [
    'trial-balance',
    'balance-sheet',
    'day-book',
    'periods',
] as const;
export type ReportTab = (typeof REPORT_TABS)[number];
