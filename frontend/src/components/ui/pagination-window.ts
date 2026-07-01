/** Max numbered page buttons shown at once; the window slides around the current page. */
export const MAX_VISIBLE_PAGES = 5;

/**
 * The sliding window of page numbers to render: shows up to `maxVisible`,
 * keeping the current page centered once past the edges and anchoring to the
 * first/last page at the ends.
 */
export function buildPageWindow(
    current: number,
    totalPages: number,
    maxVisible: number,
): number[] {
    const count = Math.min(totalPages, maxVisible);
    const half = Math.floor(maxVisible / 2);
    let startPage: number;
    if (totalPages <= maxVisible) startPage = 1;
    else if (current <= half + 1) startPage = 1;
    else if (current >= totalPages - half) startPage = totalPages - maxVisible + 1;
    else startPage = current - half;
    return Array.from({ length: count }, (_, i) => startPage + i);
}
