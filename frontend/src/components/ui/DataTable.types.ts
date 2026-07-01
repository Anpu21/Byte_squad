import type { ReactNode } from 'react';
import type { CellAlign } from './Table';

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

export interface DataTableProps<T> {
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
    /** Class applied to every data row (e.g. 'group' to enable hover-reveal cells). */
    rowClassName?: string;
    maxHeight?: string;
    className?: string;
    containerClassName?: string;
    /** Footer rendered below the table inside the same surface (e.g. <Pagination/>). */
    footer?: ReactNode;
    /** A <tr> rendered inside a <tfoot> (column-aligned totals row). */
    footerRow?: ReactNode;
    /**
     * Enable built-in client-side pagination: slices `rows` into pages of
     * `pageSize` (default 10) and renders a `<Pagination/>` footer. For
     * server-paginated data, pass pre-sliced `rows` + a manual `footer` instead.
     */
    clientPaginate?: boolean | { pageSize?: number; unit?: string };
}
