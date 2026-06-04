import { useBranchManagementPage } from '@/features/branch-management/hooks/useBranchManagementPage';
import { BranchTable } from '@/features/branch-management/components/BranchTable';
import { BranchFormModal } from '@/features/branch-management/components/BranchFormModal';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';

interface BranchManagementPageProps {
    embedded?: boolean;
}

export function BranchManagementPage({
    embedded = false,
}: BranchManagementPageProps = {}) {
    const p = useBranchManagementPage();

    const createButton = <Button onClick={p.openCreate}>+ Create branch</Button>;

    return (
        <div>
            {embedded ? (
                <div className="flex justify-end mb-4">{createButton}</div>
            ) : (
                <PageHeader
                    title="Branch Management"
                    subtitle="Create, edit, and manage all branches"
                    actions={createButton}
                />
            )}

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
        </div>
    );
}
