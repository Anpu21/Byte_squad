import {
    LuBookOpenCheck as BookOpenCheck,
    LuCalendarDays as CalendarDays,
    LuLock as Lock,
    LuScale as Scale,
} from 'react-icons/lu';
import { type NavTab } from './types';

/**
 * Tabs for workspaces that are *not* sidebar sections — they're nested inside a
 * hub (Financial reports → Accounting; the two transfer screens → Inventory) or
 * reached only by route, so they have no standalone sidebar identity. Dynamic
 * count badges are overlaid by the page at render time.
 */
export const WORKSPACE_TABS: Record<string, NavTab[]> = {
    'financial-reports': [
        { key: 'trial-balance', label: 'Trial balance', Icon: Scale },
        { key: 'balance-sheet', label: 'Balance sheet', Icon: BookOpenCheck },
        { key: 'day-book', label: 'Day book', Icon: CalendarDays },
        { key: 'periods', label: 'Period locks', Icon: Lock },
    ],
    'admin-transfers': [
        { key: 'board', label: 'Pipeline' },
        { key: 'history', label: 'History' },
        { key: 'report', label: 'Report' },
    ],
    'transfer-requests': [
        { key: 'my-requests', label: 'My Requests' },
        { key: 'incoming', label: 'Incoming' },
        { key: 'history', label: 'History' },
    ],
};
