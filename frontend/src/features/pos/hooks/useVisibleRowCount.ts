import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * How many rows of `rowHeight` px fit in the referenced scroll container,
 * tracked via ResizeObserver. Used to fill the BUSY-style grid with empty
 * numbered rows so it always looks full. Falls back to a single measure when
 * ResizeObserver is unavailable (e.g. jsdom in tests).
 */
export function useVisibleRowCount(
    ref: RefObject<HTMLElement | null>,
    rowHeight: number,
): number {
    const [count, setCount] = useState(12);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => {
            setCount(Math.max(1, Math.floor(el.clientHeight / rowHeight)));
        };
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref, rowHeight]);

    return count;
}
