import type { IBranchWithMeta } from '@/types';

interface BranchRowProps {
    branch: IBranchWithMeta;
    onEdit: (branch: IBranchWithMeta) => void;
    onToggle: (id: string) => void;
    onDelete: (branch: IBranchWithMeta) => void;
}

export function BranchRow({
    branch,
    onEdit,
    onToggle,
    onDelete,
}: BranchRowProps) {
    return (
        <tr className="border-b border-border hover:bg-surface-2">
            <td className="px-6 py-4 text-text-1 font-medium">{branch.name}</td>
            <td className="px-6 py-4 text-text-2">{branch.address}</td>
            <td className="px-6 py-4 text-text-2">{branch.phone || '—'}</td>
            <td className="px-6 py-4">
                {branch.adminName ? (
                    <div className="flex flex-col">
                        <span className="text-text-1">{branch.adminName}</span>
                        <span className="text-[11px] text-text-3">
                            {branch.adminEmail}
                        </span>
                    </div>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-warning-soft text-warning border border-warning/40 uppercase tracking-widest">
                        No admin
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-text-1">{branch.staffCount}</td>
            <td className="px-6 py-4">
                {branch.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-text-1 text-[13px]">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-text-3 text-[13px]">
                        <span className="w-2 h-2 rounded-full bg-text-3" />
                        Inactive
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                <button
                    onClick={() => onEdit(branch)}
                    className="text-xs text-text-1 hover:text-text-1 hover:underline"
                >
                    Edit
                </button>
                <button
                    onClick={() => onToggle(branch.id)}
                    className="text-xs text-text-1 hover:text-text-1 hover:underline"
                >
                    {branch.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                    onClick={() => onDelete(branch)}
                    className="text-xs text-danger hover:text-danger hover:underline"
                >
                    Delete
                </button>
            </td>
        </tr>
    );
}
