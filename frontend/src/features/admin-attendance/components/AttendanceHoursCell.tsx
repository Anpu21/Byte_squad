import { useState } from 'react';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { cn } from '@/lib/utils';

/** Inline hours editor — commits a 0–24 value on blur / Enter. */
export function AttendanceHoursCell({
    initial,
    disabled,
    onCommit,
}: {
    initial: number | null;
    disabled: boolean;
    onCommit: (hours: number) => void;
}) {
    const [text, setText] = useState(initial == null ? '' : String(initial));

    function commit() {
        const trimmed = text.trim();
        if (trimmed === '') return;
        const n = Number(trimmed);
        if (!Number.isFinite(n) || n <= 0 || n > 24 || n === initial) return;
        onCommit(n);
    }

    return (
        <input
            type="text"
            inputMode="decimal"
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            aria-label="Hours"
            placeholder="—"
            className={cn(FIELD_SHELL, FIELD_BORDER, 'w-16 h-7 px-2 text-[12px] text-right tabular-nums')}
        />
    );
}
