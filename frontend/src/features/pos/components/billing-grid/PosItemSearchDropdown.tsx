import {
    useLayoutEffect,
    useState,
    type CSSProperties,
    type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { ISearchProductRow } from '@/types';
import { PosItemSearchResults } from '@/features/pos/components/item-table/PosItemSearchResults';

interface IPosItemSearchDropdownProps {
    open: boolean;
    inputRef?: RefObject<HTMLInputElement | null>;
    results: ISearchProductRow[];
    isFetching: boolean;
    query: string;
    highlight: number;
    onSelect: (row: ISearchProductRow) => void;
}

/**
 * Portal-rendered autocomplete list for the billing grid's item fields.
 * Anchored to the input's live rect (tracks scroll/resize) so the grid's
 * overflow never clips it; opens downward, flipping up when the input sits in
 * the lower part of the viewport. Reused by the entry row + committed re-pick.
 */
export function PosItemSearchDropdown({
    open,
    inputRef,
    results,
    isFetching,
    query,
    highlight,
    onSelect,
}: IPosItemSearchDropdownProps) {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useLayoutEffect(() => {
        if (!open || !inputRef) return;
        const update = () => {
            if (inputRef.current) {
                setRect(inputRef.current.getBoundingClientRect());
            }
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open, inputRef]);

    if (!open || !rect) return null;

    const openUp = rect.top > window.innerHeight * 0.55;
    const style: CSSProperties = {
        position: 'fixed',
        left: rect.left,
        width: Math.max(rect.width, 280),
        ...(openUp
            ? { bottom: window.innerHeight - rect.top + 4 }
            : { top: rect.bottom + 4 }),
    };

    return createPortal(
        <div style={style} className="z-modal">
            <PosItemSearchResults
                results={results}
                onSelect={onSelect}
                isLoading={isFetching}
                query={query}
                highlightIndex={highlight}
            />
        </div>,
        document.body,
    );
}
