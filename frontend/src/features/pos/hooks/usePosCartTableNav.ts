import { useCallback, type KeyboardEvent, type RefObject } from 'react';

interface UsePosCartTableNavArgs {
    rowCount: number;
    colCount: number;
    tableRef: RefObject<HTMLTableElement | null>;
    fallbackRef: RefObject<HTMLInputElement | null>;
}

// Arrow-key + Enter grid navigation for the POS cart table. Cells opt in by
// setting `data-cell-row` and `data-cell-col` on their focusable element.
// Bails out silently when the event target has no cell coordinates (e.g.
// inside the discount editor) so other components keep their native keys.
export function usePosCartTableNav({
    rowCount,
    colCount,
    tableRef,
    fallbackRef,
}: UsePosCartTableNavArgs) {
    return useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            const target = event.target as HTMLElement;
            const rowAttr = target.dataset?.cellRow;
            const colAttr = target.dataset?.cellCol;
            if (rowAttr === undefined || colAttr === undefined) return;
            const row = Number(rowAttr);
            const col = Number(colAttr);
            if (Number.isNaN(row) || Number.isNaN(col)) return;

            const focusAt = (r: number, c: number): boolean => {
                if (r < 0 || c < 0 || c >= colCount) return false;
                const el = tableRef.current?.querySelector<HTMLElement>(
                    `[data-cell-row="${r}"][data-cell-col="${c}"]`,
                );
                if (!el) return false;
                el.focus();
                if (el instanceof HTMLInputElement) el.select();
                return true;
            };

            const focusFallback = (): boolean => {
                const el = fallbackRef.current;
                if (!el) return false;
                el.focus();
                el.select();
                return true;
            };

            switch (event.key) {
                case 'ArrowLeft':
                    if (focusAt(row, col - 1)) event.preventDefault();
                    break;
                case 'ArrowRight':
                    if (focusAt(row, col + 1)) event.preventDefault();
                    break;
                case 'ArrowUp':
                    if (focusAt(row - 1, col)) event.preventDefault();
                    break;
                case 'ArrowDown':
                case 'Enter':
                    if (row + 1 < rowCount) {
                        if (focusAt(row + 1, col)) event.preventDefault();
                    } else if (focusFallback()) {
                        event.preventDefault();
                    }
                    break;
            }
        },
        [rowCount, colCount, tableRef, fallbackRef],
    );
}
