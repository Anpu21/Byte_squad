import { BILLING_COLUMNS } from './columns';

const CELL = 'border-r border-b border-border px-2 py-1.5 align-middle h-[33px]';

/**
 * A blank numbered filler row, so the BUSY-style grid always looks full even
 * with few items. Non-interactive — only the S.N. cell shows its number.
 */
export function PosBillingEmptyRow({ serial }: { serial: number }) {
    return (
        <tr>
            <td className={`${CELL} text-right text-[12px] tabular-nums text-text-3/70`}>
                {serial}
            </td>
            {BILLING_COLUMNS.slice(1).map((col) => (
                <td key={col.key} className={CELL} />
            ))}
        </tr>
    );
}
