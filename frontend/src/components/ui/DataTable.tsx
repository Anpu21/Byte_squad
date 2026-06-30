import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import Table, {
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
} from './Table';
import Skeleton from './Skeleton';
import Pagination from './Pagination';
import { usePagination } from '@/hooks/usePagination';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import type { DataTableProps, SortState } from './DataTable.types';
import { SortGlyph } from './DataTableSortGlyph';

export type { DataTableColumn, SortState } from './DataTable.types';

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
    rowClassName,
    maxHeight,
    className,
    containerClassName,
    footer,
    footerRow,
    clientPaginate,
}: DataTableProps<T>) {
    const paginate: { pageSize?: number; unit?: string } | null = clientPaginate
        ? typeof clientPaginate === 'object'
            ? clientPaginate
            : {}
        : null;
    const pageSize = paginate?.pageSize ?? DEFAULT_PAGE_SIZE;
    const pagination = usePagination(rows, pageSize);
    const visibleRows = paginate ? pagination.pageRows : rows;
    const resolvedFooter =
        footer ??
        (paginate && pagination.total > 0 ? (
            <Pagination
                page={pagination.page}
                pageSize={pageSize}
                total={pagination.total}
                onPageChange={pagination.setPage}
                unit={paginate.unit ?? 'items'}
            />
        ) : null);

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
                {resolvedFooter}
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
                        : visibleRows.map((row, i) => (
                              <TableRow
                                  key={getRowKey(row, i)}
                                  className={cn(
                                      zebra && 'even:bg-surface-2/30',
                                      rowClassName,
                                  )}
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
                {footerRow && (
                    <tfoot className="bg-surface-2/40 border-t border-border">
                        {footerRow}
                    </tfoot>
                )}
            </Table>
            {resolvedFooter}
        </div>
    );
}
