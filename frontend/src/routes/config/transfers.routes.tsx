import { Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { TransferHistoryRedirect } from '../redirects';
import { TransferRequestsPage } from '@/features/transfer-requests';
import { NewTransferRequestPage } from '@/features/transfer-request-create';
import { TransferDetailPage } from '@/features/transfer-detail';
import { AdminTransfersPage } from '@/features/admin-transfer-board';
import { AdminTransferCreatePage } from '@/features/admin-transfer-create';
import {
    ShipmentsListPage,
    ShipmentCreatePage,
    ShipmentDetailPage,
} from '@/features/shipment-tracking';

/** Stock transfers + shipments — wrapped by `DashboardLayout`. */
export const transfersRoutes = (
    <>
        <Route element={<RequireRole roles={[UserRole.ADMIN, UserRole.MANAGER]} />}>
            <Route
                path={FRONTEND_ROUTES.TRANSFERS}
                element={<TransferRequestsPage />}
                handle={{ crumbs: ['Inventory', 'Transfers'] }}
            />
            <Route
                path={FRONTEND_ROUTES.TRANSFERS_NEW}
                element={<NewTransferRequestPage />}
                handle={{ crumbs: ['Transfers', 'New'] }}
            />
            <Route
                path={FRONTEND_ROUTES.TRANSFER_HISTORY}
                element={<TransferHistoryRedirect />}
                handle={{ crumbs: ['Transfers', 'History'] }}
            />
            <Route
                path={FRONTEND_ROUTES.TRANSFER_DETAIL}
                element={<TransferDetailPage />}
                handle={{ crumbs: ['Transfers', 'Detail'] }}
            />
        </Route>
        <Route element={<RequireRole roles={[UserRole.ADMIN]} />}>
            <Route
                path={FRONTEND_ROUTES.ADMIN_TRANSFER_NEW}
                element={<AdminTransferCreatePage />}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_TRANSFERS}
                element={<AdminTransfersPage />}
                handle={{ crumbs: ['Admin', 'Transfers'] }}
            />
        </Route>
        <Route
            element={
                <RequireRole
                    roles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER]}
                />
            }
        >
            <Route
                path={FRONTEND_ROUTES.SHIPMENTS}
                element={<ShipmentsListPage />}
            />
            <Route
                path={FRONTEND_ROUTES.SHIPMENT_DETAIL}
                element={<ShipmentDetailPage />}
            />
        </Route>
        <Route element={<RequireRole roles={[UserRole.ADMIN, UserRole.MANAGER]} />}>
            <Route
                path={FRONTEND_ROUTES.SHIPMENT_NEW}
                element={<ShipmentCreatePage />}
            />
        </Route>
    </>
);
