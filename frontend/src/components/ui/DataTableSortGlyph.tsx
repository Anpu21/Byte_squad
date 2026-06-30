import { cn } from '@/lib/utils';
import type { SortState } from './DataTable.types';

/** The asc/desc caret shown in a sortable column header. */
export function SortGlyph({
    active,
    dir,
}: {
    active: boolean;
    dir?: SortState['dir'];
}) {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-30')}
            aria-hidden
        >
            {dir === 'desc' ? <path d="m6 9 6 6 6-6" /> : <path d="m18 15-6-6-6 6" />}
        </svg>
    );
}
