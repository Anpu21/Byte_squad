import {
    type KeyboardEvent,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Check } from 'lucide-react';

interface PosDiscountEditorProps {
    initialAmount: number;
    onCommit: (amount: number) => void;
    onCancel: () => void;
}

export function PosDiscountEditor({
    initialAmount,
    onCommit,
    onCancel,
}: PosDiscountEditorProps) {
    const [value, setValue] = useState(
        initialAmount > 0 ? String(initialAmount) : '',
    );
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    function commit() {
        const parsed = parseFloat(value);
        const amount =
            Number.isFinite(parsed) && parsed > 0
                ? Math.min(parsed, 100)
                : 0;
        onCommit(amount);
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            // Don't let the page-level Esc handler fire and close other UI.
            e.stopPropagation();
            e.preventDefault();
            onCancel();
        }
    }

    return (
        <div className="inline-flex items-center gap-1 bg-canvas border border-border rounded-md p-0.5">
            <input
                ref={inputRef}
                type="number"
                min="0"
                max="100"
                step="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="0"
                aria-label="Discount percentage"
                className="w-12 h-7 px-1.5 bg-transparent text-right text-[12px] font-semibold tabular-nums mono text-text-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span
                aria-hidden
                className="text-[11px] font-bold text-text-2 mono pr-0.5"
            >
                %
            </span>
            <button
                type="button"
                onClick={commit}
                aria-label="Apply discount"
                title="Apply"
                className="h-7 w-7 rounded text-text-inv bg-primary hover:bg-primary-hover transition-colors flex items-center justify-center focus:outline-none focus:ring-[2px] focus:ring-primary/40"
            >
                <Check size={13} strokeWidth={2.5} />
            </button>
        </div>
    );
}
