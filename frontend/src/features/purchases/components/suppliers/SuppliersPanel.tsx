import { useState } from 'react';
import { LuPlus as Plus, LuSearch as Search } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { ISupplier, SupplierStatus } from '@/types';
import { useSuppliers } from '../../hooks/useSuppliers';
import { SuppliersTable } from './SuppliersTable';
import { SupplierFormModal } from './SupplierFormModal';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

/**
 * Suppliers tab of the Purchases workspace: search + status filter +
 * master list + add/edit modal. Suppliers are global; deactivate rather
 * than delete so historical GRNs keep a valid party.
 */
export function SuppliersPanel() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | SupplierStatus>('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ISupplier | null>(null);

    const suppliersQuery = useSuppliers({
        search: search || undefined,
        status: status || undefined,
        limit: 100,
        offset: 0,
    });
    const rows = suppliersQuery.data?.rows ?? [];

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(supplier: ISupplier) {
        setEditing(supplier);
        setFormOpen(true);
    }

    return (
        <>
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3"
                            aria-hidden
                        />
                        <input
                            className={`${INPUT_CLASS} pl-8 w-64`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, contact, phone…"
                            aria-label="Search suppliers"
                        />
                    </div>
                    <select
                        className={INPUT_CLASS}
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as '' | SupplierStatus)
                        }
                        aria-label="Filter by status"
                    >
                        <option value="">All statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                    <div className="ml-auto">
                        <Button variant="primary" onClick={openCreate}>
                            <Plus size={14} aria-hidden />
                            Add supplier
                        </Button>
                    </div>
                </div>
                <SuppliersTable
                    rows={rows}
                    isLoading={suppliersQuery.isLoading}
                    onEdit={openEdit}
                />
            </Card>
            <SupplierFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                supplier={editing}
            />
        </>
    );
}
