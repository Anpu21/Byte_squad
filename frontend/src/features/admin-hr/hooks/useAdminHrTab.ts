import { useTabParam } from '@/hooks/useTabParam';

export type AdminHrTab = 'employees' | 'attendance' | 'leaves' | 'payroll';

const VALID_TABS: AdminHrTab[] = [
    'employees',
    'attendance',
    'leaves',
    'payroll',
];

/** Active tab for the HR workspace. Thin wrapper over {@link useTabParam}. */
export function useAdminHrTab() {
    return useTabParam<AdminHrTab>({ valid: VALID_TABS, fallback: 'employees' });
}
