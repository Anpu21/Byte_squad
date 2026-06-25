import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Table, {
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
    type CellAlign,
} from './Table';
import Skeleton from './Skeleton';

export interface DataTableColumn<T> {
    /** Stable id; also the sort key when `sortable` is set. */
    key: string;
    header: ReactNode;
    align?: CellAlign;
    /** Monospace + tabular figures (prices, counts, codes). */
    numeric?: boolean;
    /** CSS width applied to the header cell (e.g. '12rem'). */
    width?: string;
    className?: string;
    headerClassName?: string;
    sortable?: boolean;
    /** Render the cell. Falls back to `accessor`, then nothing. */
    render?: (row: T, index: number) => ReactNode;
    accessor?: (row: T) => ReactNode;
}

export interface SortState {
    key: string;
    dir: 'asc' | 'desc';
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    rows: T[];
    getRowKey: (row: T, index: number) => string | number;
    onRowClick?: (row: T) => void;
    /** Accessible name for a clickable row (announced when the row acts as a button). */
    getRowLabel?: (row: T) => string;
    isLoading?: boolean;
    /** Skeleton row count while loading (default 6). */
    loadingRows?: number;
    /** Rendered when there are no rows and not loading (usually an <EmptyState/>). */
    empty?: ReactNode;
    sort?: SortState;
    onSortChange?: (next: SortState) => void;
    stickyHeader?: boolean;
    /** Subtle alternating row tint for scannability on dense tables. */
    zebra?: boolean;
    maxHeight?: string;
    className?: string;
    containerClassName?: string;
    /** Footer rendered below the table inside the same surface (e.g. <Pagination/>). */
    footer?: ReactNode;
}

/**
 * Column-driven table built on the `Table` primitives. Handles loading
 * skeletons, empty state, sticky header, sortable headers (with `aria-sort`),
 * and clickable rows — the workhorse for the app's data-dense screens.
 */
export default function DataTable<T>({
    columns,
    rows,
    getRowKey,
    onRowClick,
    getRowLabel,
    isLoading,
    loadingRows = 6,
    empty,
    sort,
    onSortChange,
    stickyHeader,
    zebra,
    maxHeight,
    className,
    containerClassName,
    footer,
}: DataTableProps<T>) {
    function toggleSort(key: string) {
        if (!onSortChange) return;
        const dir: SortState['dir'] =
            sort?.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        onSortChange({ key, dir });
    }

    function handleRowKey(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
        if (!onRowClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onRowClick(row);
        }
    }

    if (!isLoading && rows.length === 0) {
        return (
            <div className={className}>
                {empty}
                {footer}
            </div>
        );
    }

    return (
        <div className={className}>
            <Table scroll maxHeight={maxHeight} containerClassName={containerClassName}>
                <TableHead sticky={stickyHeader}>
                    <tr>
                        {columns.map((col) => {
                            const isSorted = sort?.key === col.key;
                            const sortDir = isSorted ? sort?.dir : undefined;
                            return (
                                <TableHeaderCell
                                    key={col.key}
                                    align={col.align}
                                    className={col.headerClassName}
                                    style={col.width ? { width: col.width } : undefined}
                                    aria-sort={
                                        col.sortable
                                            ? sortDir === 'asc'
                                                ? 'ascending'
                                                : sortDir === 'desc'
                                                  ? 'descending'
                                                  : 'none'
                                            : undefined
                                    }
                                >
                                    {col.sortable && onSortChange ? (
                                        <button
                                            type="button"
                                            onClick={() => toggleSort(col.key)}
                                            className={cn(
                                                'inline-flex items-center gap-1 uppercase tracking-[0.07em] hover:text-text-1 transition-colors focus:outline-none focus-visible:text-text-1',
                                                col.align === 'right' && 'flex-row-reverse',
                                            )}
                                        >
                                            {col.header}
                                            <SortGlyph active={isSorted} dir={sortDir} />
                                        </button>
                                    ) : (
                                        col.header
                                    )}
                                </TableHeaderCell>
                            );
                        })}
                    </tr>
                </TableHead>
                <TableBody>
                    {isLoading
                        ? Array.from({ length: loadingRows }).map((_, r) => (
                              <TableRow key={`skeleton-${r}`}>
                                  {columns.map((col) => (
                                      <TableCell key={col.key} align={col.align}>
                                          <Skeleton className="h-3.5 w-full max-w-[140px]" />
                                      </TableCell>
                                  ))}
                              </TableRow>
                          ))
                        : rows.map((row, i) => (
                              <TableRow
                                  key={getRowKey(row, i)}
                                  className={zebra ? 'even:bg-surface-2/30' : undefined}
                                  interactive={!!onRowClick}
                                  role={onRowClick ? 'button' : undefined}
                                  tabIndex={onRowClick ? 0 : undefined}
                                  aria-label={
                                      onRowClick ? getRowLabel?.(row) : undefined
                                  }
                                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                                  onKeyDown={
                                      onRowClick ? (e) => handleRowKey(e, row) : undefined
                                  }
                              >
                                  {columns.map((col) => (
                                      <TableCell
                                          key={col.key}
                                          align={col.align}
                                          numeric={col.numeric}
                                          className={col.className}
                                      >
                                          {col.render
                                              ? col.render(row, i)
                                              : col.accessor
                                                ? col.accessor(row)
                                                : null}
                                      </TableCell>
                                  ))}
                              </TableRow>
                          ))}
                </TableBody>
            </Table>
            {footer}
        </div>
    );
}

function SortGlyph({ active, dir }: { active: boolean; dir?: SortState['dir'] }) {
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
