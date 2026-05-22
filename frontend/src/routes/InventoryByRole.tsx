import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage';
import { InventoryListPage } from '@/pages/inventory/InventoryListPage';

export function InventoryByRole() {
    const { user } = useAuth();
    return user?.role === UserRole.ADMIN ? (
        <AdminInventoryPage />
    ) : (
        <InventoryListPage />
    );
}
