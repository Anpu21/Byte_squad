import type {
    HTMLAttributes,
    TableHTMLAttributes,
    TdHTMLAttributes,
    ThHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export type CellAlign = 'left' | 'center' | 'right';

const alignClass: Record<CellAlign, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
};

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
    /** Wrap the table in an overflow container so wide tables scroll, not break layout. */
    scroll?: boolean;
    /** Cap the vertical height and scroll the body (pairs with a sticky head). */
    maxHeight?: string;
    containerClassName?: string;
}

/**
 * The app's base table. Encodes the shared token styling (header tint, row
 * borders, dense padding) so features compose `<Table>` parts instead of
 * hand-rolling `<table>` markup. For column-driven tables prefer `DataTable`.
 */
export default function Table({
    scroll = true,
    maxHeight,
    containerClassName,
    className,
    children,
    ...props
}: TableProps) {
    const table = (
        <table className={cn('w-full text-left border-collapse', className)} {...props}>
            {children}
        </table>
    );

    if (!scroll && !maxHeight) return table;

    return (
        <div
            className={cn('overflow-auto', containerClassName)}
            style={maxHeight ? { maxHeight } : undefined}
        >
            {table}
        </div>
    );
}

interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
    sticky?: boolean;
}

export function TableHead({ sticky, className, ...props }: TableHeadProps) {
    return (
        <thead
            className={cn(
                'bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-2',
                sticky && 'sticky top-0 z-sticky',
                className,
            )}
            {...props}
        />
    );
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody {...props} />;
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    /** Adds hover + pointer affordance for clickable rows. */
    interactive?: boolean;
}

export function TableRow({ interactive, className, ...props }: TableRowProps) {
    return (
        <tr
            className={cn(
                'border-b border-border last:border-b-0',
                interactive &&
                    'hover:bg-surface-2 transition-colors cursor-pointer focus:outline-none focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                className,
            )}
            {...props}
        />
    );
}

interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
    align?: CellAlign;
}

export function TableHeaderCell({
    align = 'left',
    className,
    ...props
}: TableHeaderCellProps) {
    return (
        <th
            className={cn(
                'px-4 py-2.5 font-semibold whitespace-nowrap border-b border-border',
                alignClass[align],
                className,
            )}
            {...props}
        />
    );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
    align?: CellAlign;
    /** Monospace + tabular figures for numeric / code columns. */
    numeric?: boolean;
}

export function TableCell({
    align = 'left',
    numeric,
    className,
    ...props
}: TableCellProps) {
    return (
        <td
            className={cn(
                'px-4 py-2.5 text-[13px] text-text-1',
                alignClass[align],
                numeric && 'mono tabular-nums',
                className,
            )}
            {...props}
        />
    );
}
