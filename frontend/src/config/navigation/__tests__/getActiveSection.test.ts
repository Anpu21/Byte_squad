import { describe, expect, it } from 'vitest';
import { getActiveSection } from '@/config/navigation';
import { UserRole } from '@/constants/enums';

describe('getActiveSection', () => {
    it('exact-matches a sidebar route to its group + item', () => {
        const section = getActiveSection('/accounting', UserRole.ADMIN);
        expect(section?.group).toBe('Finance');
        expect(section?.item.id).toBe('accounting');
    });

    it('treats a deep child route as its parent (longest prefix)', () => {
        expect(getActiveSection('/inventory/add', UserRole.ADMIN)?.item.id).toBe('inventory');
    });

    it('prefers the longer prefix: /accounting/reports → accounting, not /reports', () => {
        const section = getActiveSection('/accounting/reports', UserRole.ADMIN);
        expect(section?.item.id).toBe('accounting');
        expect(section?.group).toBe('Finance');
    });

    it('maps prefix-less transfer routes to the inventory section', () => {
        expect(getActiveSection('/transfers', UserRole.ADMIN)?.item.id).toBe('inventory');
        expect(getActiveSection('/admin/transfers', UserRole.ADMIN)?.item.id).toBe('inventory');
    });

    it('maps standalone HR sub-routes to the hr section, not the /admin/leaves item', () => {
        expect(getActiveSection('/admin/employees', UserRole.ADMIN)?.item.id).toBe('hr');
        expect(getActiveSection('/admin/payroll', UserRole.ADMIN)?.item.id).toBe('hr');
        expect(getActiveSection('/admin/leaves', UserRole.CASHIER)?.item.id).toBe('leaves');
    });

    it('returns null for chrome routes with no sidebar owner', () => {
        expect(getActiveSection('/profile', UserRole.ADMIN)).toBeNull();
    });

    it('respects role visibility for overrides', () => {
        // Cashier has no inventory/hr items, so the override targets are skipped.
        expect(getActiveSection('/transfers', UserRole.CASHIER)).toBeNull();
        expect(getActiveSection('/admin/employees', UserRole.CASHIER)).toBeNull();
    });
});
