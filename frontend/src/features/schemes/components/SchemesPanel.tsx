import { useMemo, useState } from 'react';
import { LuPlus as Plus } from 'react-icons/lu';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IDiscountScheme } from '@/types';
import { inventoryService } from '@/services/inventory.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useSchemes } from '../hooks/useSchemes';
import { SchemesTable } from './SchemesTable';
import { SchemeFormModal } from './SchemeFormModal';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

/**
 * Discount-schemes workspace: status filter + list + create/edit modal.
 * Managers see their branch's rules plus global ones; admins see all and
 * can create global (all-branch) rules.
 */
export function SchemesPanel() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>(
        '',
    );
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<IDiscountScheme | null>(null);

    const schemesQuery = useSchemes(
        statusFilter === '' ? undefined : statusFilter === 'true',
    );
    const rows = schemesQuery.data?.rows ?? [];

    const productsQuery = useQuery({
        queryKey: queryKeys.product.all(),
        queryFn: inventoryService.getProducts,
    });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isAdmin,
    });
    const productNameById = useMemo(
        () =>
            new Map((productsQuery.data ?? []).map((p) => [p.id, p.name])),
        [productsQuery.data],
    );
    const branchNameById = useMemo(
        () =>
            new Map((branchesQuery.data ?? []).map((b) => [b.id, b.name])),
        [branchesQuery.data],
    );

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(scheme: IDiscountScheme) {
        setEditing(scheme);
        setFormOpen(true);
    }

    return (
        <>
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                    <select
                        className={`${INPUT_CLASS} field-select`}
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as '' | 'true' | 'false',
                            )
                        }
                        aria-label="Filter by status"
                    >
                        <option value="">All statuses</option>
                        <option value="true">Active</option>
                        <option value="false">Paused</option>
                    </select>
                    <div className="ml-auto">
                        <Button variant="primary" onClick={openCreate}>
                            <Plus size={14} aria-hidden />
                            New scheme
                        </Button>
                    </div>
                </div>
                <SchemesTable
                    rows={rows}
                    isLoading={schemesQuery.isLoading}
                    productNameById={productNameById}
                    branchNameById={branchNameById}
                    onEdit={openEdit}
                />
            </Card>
            <SchemeFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                scheme={editing}
            />
        </>
    );
}
