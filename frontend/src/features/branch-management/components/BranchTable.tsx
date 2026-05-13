import type { IBranchWithMeta } from '@/types';
import { BranchRow } from './BranchRow';

interface BranchTableProps {
    branches: IBranchWithMeta[];
    isLoading: boolean;
    onEdit: (branch: IBranchWithMeta) => void;
    onToggle: (id: string) => void;
    onDelete: (branch: IBranchWithMeta) => void;
}

const HEADERS = [
    'Code',
    'Name',
    'Address',
    'Phone',
    'Manager',
    'Staff',
    'Status',
];

export function BranchTable({
    branches,
    isLoading,
    onEdit,
    onToggle,
    onDelete,
}: BranchTableProps) {
    return (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3">
                                {HEADERS.map((h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-4 font-semibold"
                                    >
                                        {h}
                                    </th>
                                ))}
                                <th className="px-6 py-4 font-semibold text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {branches.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={HEADERS.length + 1}
                                        className="px-6 py-16 text-center text-text-3"
                                    >
                                        No branches yet
                                    </td>
                                </tr>
                            ) : (
                                branches.map((b) => (
                                    <BranchRow
                                        key={b.id}
                                        branch={b}
                                        onEdit={onEdit}
                                        onToggle={onToggle}
                                        onDelete={onDelete}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
