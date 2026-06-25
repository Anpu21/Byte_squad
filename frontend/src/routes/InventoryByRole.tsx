import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { AdminInventoryPage } from '@/features/admin-inventory';
import { InventoryListPage } from '@/features/inventory-list';

export function InventoryByRole() {
    const { user } = useAuth();
    return user?.role === UserRole.ADMIN ? (
        <AdminInventoryPage />
    ) : (
        <InventoryListPage />
    );
}
