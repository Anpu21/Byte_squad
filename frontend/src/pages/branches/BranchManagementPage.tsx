import { useBranchManagementPage } from '@/features/branch-management/hooks/useBranchManagementPage';
import { BranchTable } from '@/features/branch-management/components/BranchTable';
import { BranchFormModal } from '@/features/branch-management/components/BranchFormModal';
import { BranchActionOtpModal } from '@/features/branch-management/components/BranchActionOtpModal';

interface BranchManagementPageProps {
    embedded?: boolean;
}

export function BranchManagementPage({
    embedded = false,
}: BranchManagementPageProps = {}) {
    const p = useBranchManagementPage();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div
                className={
                    embedded
                        ? 'flex justify-end mb-4'
                        : 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8'
                }
            >
                {!embedded && (
                    <div>
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                            Branch Management
                        </h1>
                        <p className="text-sm text-text-2 mt-1">
                            Create, edit, and manage all branches
                        </p>
                    </div>
                )}
                <button
                    onClick={p.openCreate}
                    className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all self-start sm:self-auto"
                >
                    + Create Branch
                </button>
            </div>

            <BranchTable
                branches={p.branches}
                isLoading={p.isLoading}
                onEdit={p.openEdit}
                onToggle={p.onToggle}
                onDelete={p.onRequestDelete}
            />

            {p.showModal && (
                <BranchFormModal
                    editing={p.editing}
                    onClose={p.closeModal}
                    onSaved={p.onSaved}
                />
            )}

            {p.pendingDelete && (
                <BranchActionOtpModal
                    actionId={p.pendingDelete.pending.actionId}
                    expiresAt={p.pendingDelete.pending.expiresAt}
                    action={p.pendingDelete.pending.action}
                    branchLabel={p.pendingDelete.branchName}
                    onClose={p.closePendingDelete}
                    onConfirmed={p.handleDeleteConfirmed}
                />
            )}
        </div>
    );
}
