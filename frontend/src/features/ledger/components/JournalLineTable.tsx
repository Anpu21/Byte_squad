import { LuTrash2 as Trash2 } from 'react-icons/lu';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { IJournalLineDraft, ParsedJournalLine } from './journal-voucher.lib';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface JournalAccount {
    id: string;
    code: string;
    name: string;
}

interface JournalLineTableProps {
    parsed: ParsedJournalLine[];
    accounts: JournalAccount[];
    accountsLoading: boolean;
    onPatchLine: (key: number, patch: Partial<IJournalLineDraft>) => void;
    onRemoveLine: (key: number) => void;
}

/** Account / debit-credit / amount / description grid for a journal voucher. */
export function JournalLineTable({
    parsed,
    accounts,
    accountsLoading,
    onPatchLine,
    onRemoveLine,
}: JournalLineTableProps) {
    return (
        <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-2 py-2 font-medium min-w-[200px]">
                            Account
                        </th>
                        <th className="px-2 py-2 font-medium w-24">Side</th>
                        <th className="px-2 py-2 font-medium w-28">Amount</th>
                        <th className="px-2 py-2 font-medium">Description</th>
                        <th className="px-2 py-2 w-10" />
                    </tr>
                </thead>
                <tbody>
                    {parsed.map((line) => (
                        <tr
                            key={line.key}
                            className="border-b border-border last:border-b-0"
                        >
                            <td className="px-2 py-1.5">
                                <select
                                    className={`${INPUT_CLASS} field-select w-full h-8`}
                                    value={line.accountId}
                                    onChange={(e) =>
                                        onPatchLine(line.key, {
                                            accountId: e.target.value,
                                        })
                                    }
                                    aria-label="Account"
                                >
                                    <option value="">
                                        {accountsLoading
                                            ? 'Loading…'
                                            : 'Select account'}
                                    </option>
                                    {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.code} — {a.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-2 py-1.5">
                                <select
                                    className={`${INPUT_CLASS} field-select w-full h-8`}
                                    value={line.entryType}
                                    onChange={(e) =>
                                        onPatchLine(line.key, {
                                            entryType: e.target.value as
                                                | 'debit'
                                                | 'credit',
                                        })
                                    }
                                    aria-label="Debit or credit"
                                >
                                    <option value="debit">Debit</option>
                                    <option value="credit">Credit</option>
                                </select>
                            </td>
                            <td className="px-2 py-1.5">
                                <input
                                    className={`${INPUT_CLASS} w-full h-8 text-right`}
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={line.amount}
                                    onChange={(e) =>
                                        onPatchLine(line.key, {
                                            amount: e.target.value,
                                        })
                                    }
                                    aria-label="Amount"
                                />
                            </td>
                            <td className="px-2 py-1.5">
                                <input
                                    className={`${INPUT_CLASS} w-full h-8`}
                                    value={line.description}
                                    onChange={(e) =>
                                        onPatchLine(line.key, {
                                            description: e.target.value,
                                        })
                                    }
                                    maxLength={255}
                                    aria-label="Line description"
                                />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                                <button
                                    type="button"
                                    onClick={() => onRemoveLine(line.key)}
                                    aria-label="Remove line"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded text-text-3 hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-40"
                                    disabled={parsed.length <= 2}
                                >
                                    <Trash2 size={14} aria-hidden />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
