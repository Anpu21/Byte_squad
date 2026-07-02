import { Navigate, Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { InventoryRedirect } from '../redirects';
import { InventoryWorkspacePage } from '@/features/admin-inventory';
import { PurchasesWorkspacePage } from '@/features/purchases';
import { StockAdjustmentNewPage } from '@/features/stock-adjustments';
import { ReturnNewPage, ReturnsHubPage } from '@/features/returns';
import { ProductFormPage } from '@/features/product-form';
import { BrandAnalyticsPage } from '@/features/brand-analytics';

/** Inventory + purchases — wrapped by `DashboardLayout` in the aggregator. */
export const inventoryRoutes = (
    <>
        <Route element={<RequireRole roles={[UserRole.ADMIN, UserRole.MANAGER]} />}>
            <Route
                path={FRONTEND_ROUTES.INVENTORY}
                element={<InventoryWorkspacePage />}
                handle={{ crumbs: ['Inventory'] }}
            />
            <Route
                path={FRONTEND_ROUTES.PURCHASES}
                element={<PurchasesWorkspacePage />}
                handle={{ crumbs: ['Inventory', 'Purchases'] }}
            />
            <Route
                path={FRONTEND_ROUTES.BRAND_ANALYTICS}
                element={<BrandAnalyticsPage />}
                handle={{ crumbs: ['Inventory', 'Brand analysis'] }}
            />
            <Route
                path={FRONTEND_ROUTES.INVENTORY_EXPIRY}
                element={<InventoryRedirect tab="expiry" />}
                handle={{ crumbs: ['Inventory', 'Expiry'] }}
            />
            <Route
                path={FRONTEND_ROUTES.STOCK_ADJUSTMENT_NEW}
                element={<StockAdjustmentNewPage />}
                handle={{ crumbs: ['Inventory', 'Adjustments', 'New'] }}
            />
            <Route
                path={FRONTEND_ROUTES.STOCK_ADJUSTMENTS}
                element={<InventoryRedirect tab="adjustments" />}
                handle={{ crumbs: ['Inventory', 'Adjustments'] }}
            />
            <Route
                path={FRONTEND_ROUTES.RETURN_NEW}
                element={<ReturnNewPage />}
                handle={{ crumbs: ['Returns', 'New'] }}
            />
        </Route>
        {/* Returns hub — a dedicated, role-scoped section (cashiers see their
            own, managers their branch, admins all). */}
        <Route
            element={
                <RequireRole
                    roles={[
                        UserRole.ADMIN,
                        UserRole.MANAGER,
                        UserRole.CASHIER,
                    ]}
                />
            }
        >
            <Route
                path={FRONTEND_ROUTES.RETURNS}
                element={<ReturnsHubPage />}
                handle={{ crumbs: ['Returns'] }}
            />
            {/* Legacy path — the returns list used to live under Inventory. */}
            <Route
                path="/inventory/returns"
                element={<Navigate to={FRONTEND_ROUTES.RETURNS} replace />}
            />
        </Route>
        <Route element={<RequireRole roles={[UserRole.MANAGER]} />}>
            <Route
                path={FRONTEND_ROUTES.INVENTORY_ADD}
                element={<ProductFormPage />}
                handle={{ crumbs: ['Inventory', 'Products', 'Add new'] }}
            />
            <Route
                path={FRONTEND_ROUTES.INVENTORY_EDIT}
                element={<ProductFormPage />}
                handle={{ crumbs: ['Inventory', 'Products', 'Edit'] }}
            />
            <Route
                path={FRONTEND_ROUTES.MANAGER_CATEGORIES}
                element={<InventoryRedirect tab="categories" />}
            />
        </Route>
        <Route element={<RequireRole roles={[UserRole.ADMIN]} />}>
            <Route
                path={FRONTEND_ROUTES.ADMIN_CATEGORIES}
                element={<InventoryRedirect tab="categories" />}
            />
        </Route>
    </>
);
