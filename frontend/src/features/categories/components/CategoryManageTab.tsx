import { useState } from 'react';
import { LuArchive as Archive, LuPencil as Pencil, LuPlus as Plus } from 'react-icons/lu';
import {
    Button,
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import { useConfirm } from '@/hooks/useConfirm';
import { useCategoriesQuery } from '../hooks/useCategoriesQuery';
import { useArchiveCategory } from '../hooks/useArchiveCategory';
import { CategoryFormModal } from './CategoryFormModal';
import type { ICategory } from '@/types';

interface CategoryManageTabProps {
    isAdmin: boolean;
}

export function CategoryManageTab({ isAdmin }: CategoryManageTabProps) {
    // Include archived rows so admins can see (and the table reflects) the full set.
    const { data: categories = [], isLoading } = useCategoriesQuery(true);
    const archive = useArchiveCategory();
    const confirm = useConfirm();
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ICategory | null>(null);

    const openAdd = () => {
        setEditing(null);
        setModalOpen(true);
    };
    const openEdit = (category: ICategory) => {
        setEditing(category);
        setModalOpen(true);
    };
    const handleArchive = async (category: ICategory) => {
        const ok = await confirm({
            title: 'Archive category',
            body: `Archive "${category.name}"? Products keep their category, but it will be hidden from new selections.`,
            confirmLabel: 'Archive',
        });
        if (ok) archive.mutate(category.id);
    };

    const columns: DataTableColumn<ICategory>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (category) => (
                <span className="inline-flex items-center gap-2 font-medium text-text-1">
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: category.color ?? 'var(--text-3)' }}
                    />
                    {category.name}
                </span>
            ),
        },
        {
            key: 'desc',
            header: 'Description',
            className: 'text-text-2',
            render: (category) => category.description ?? '—',
        },
        {
            key: 'status',
            header: 'Status',
            render: (category) => (
                <span className={category.isActive ? 'text-text-1' : 'text-text-3'}>
                    {category.isActive ? 'Active' : 'Archived'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (category) => (
                <div className="flex justify-end gap-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(category)}
                    >
                        <Pencil size={13} /> Edit
                    </Button>
                    {isAdmin && category.isActive && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleArchive(category)}
                        >
                            <Archive size={13} /> Archive
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-text-2">
                    {categories.length}{' '}
                    {categories.length === 1 ? 'category' : 'categories'}
                </p>
                <Button onClick={openAdd} size="sm">
                    <Plus size={14} /> Add category
                </Button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
                <DataTable
                    columns={columns}
                    rows={categories}
                    getRowKey={(category) => category.id}
                    isLoading={isLoading}
                    zebra
                    clientPaginate={{ unit: 'categories' }}
                    empty={<EmptyState title="No categories yet" />}
                />
            </div>

            {modalOpen && (
                <CategoryFormModal
                    editing={editing}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}
