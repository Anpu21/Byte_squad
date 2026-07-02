import { formatCurrency } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { ILineDraft, ParsedReturnLine } from './usePosReturn';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface PosReturnLinesTableProps {
    parsed: ParsedReturnLine[];
    onPatchDraft: (saleItemId: string, patch: Partial<ILineDraft>) => void;
    onPatchQty: (saleItemId: string, field: 'good' | 'bad', raw: string) => void;
}

/** Per-line good/bad quantity split with restock toggle and per-line refund. */
export function PosReturnLinesTable({
    parsed,
    onPatchDraft,
    onPatchQty,
}: PosReturnLinesTableProps) {
    return (
        <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-2 py-2 font-medium">Item</th>
                        <th className="px-2 py-2 font-medium text-right">Left</th>
                        <th className="px-2 py-2 font-medium w-24">Good</th>
                        <th className="px-2 py-2 font-medium w-24">Bad</th>
                        <th className="px-2 py-2 font-medium">Restock</th>
                        <th className="px-2 py-2 font-medium text-right">
                            Refund
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {parsed.map(({ line, draft, refund, over }) => (
                        <tr
                            key={line.saleItemId}
                            className="border-b border-border last:border-b-0"
                        >
                            <td className="px-2 py-1.5 text-[13px] text-text-1">
                                {line.productName}
                                <span className="block text-[11px] text-text-3">
                                    {formatCurrency(Number(line.unitPrice))} /{' '}
                                    {line.unitLabel ?? 'unit'}
                                </span>
                            </td>
                            <td className="px-2 py-1.5 text-right text-[13px] tabular-nums text-text-2">
                                {line.remaining}
                            </td>
                            <td className="px-2 py-1.5">
                                <input
                                    className={`${INPUT_CLASS} w-full h-9 text-right ${over ? 'border-danger' : ''}`}
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={draft.good}
                                    onChange={(e) =>
                                        onPatchQty(
                                            line.saleItemId,
                                            'good',
                                            e.target.value,
                                        )
                                    }
                                    aria-label={`Good quantity for ${line.productName}`}
                                />
                            </td>
                            <td className="px-2 py-1.5">
                                <input
                                    className={`${INPUT_CLASS} w-full h-9 text-right ${over ? 'border-danger' : ''}`}
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={draft.bad}
                                    onChange={(e) =>
                                        onPatchQty(
                                            line.saleItemId,
                                            'bad',
                                            e.target.value,
                                        )
                                    }
                                    aria-label={`Bad quantity for ${line.productName}`}
                                />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                                <input
                                    type="checkbox"
                                    checked={draft.restockGood}
                                    onChange={(e) =>
                                        onPatchDraft(line.saleItemId, {
                                            restockGood: e.target.checked,
                                        })
                                    }
                                    aria-label={`Restock good units of ${line.productName}`}
                                />
                            </td>
                            <td className="px-2 py-1.5 text-right text-[13px] tabular-nums text-text-1">
                                {refund > 0 ? formatCurrency(refund) : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
