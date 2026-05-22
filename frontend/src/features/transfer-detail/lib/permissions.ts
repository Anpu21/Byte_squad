import { TransferStatus, UserRole } from '@/constants/enums';
import type { IStockTransferRequest, IUser } from '@/types';

export interface TransferPermissions {
    canApproveOrReject: boolean;
    canCancel: boolean;
    canShip: boolean;
    canReceive: boolean;
    hasAnyAction: boolean;
}

export function computeTransferPermissions(
    transfer: IStockTransferRequest,
    user: IUser | null | undefined,
): TransferPermissions {
    const isAdmin = user?.role === UserRole.ADMIN;
    const isSourceManager =
        user?.role === UserRole.MANAGER &&
        transfer.sourceBranchId === user?.branchId;
    const isDestinationManager =
        user?.role === UserRole.MANAGER &&
        transfer.destinationBranchId === user?.branchId;

    const canApproveOrReject =
        isAdmin && transfer.status === TransferStatus.PENDING;
    const canCancel =
        isAdmin &&
        (transfer.status === TransferStatus.PENDING ||
            transfer.status === TransferStatus.APPROVED);
    const canShip =
        (isAdmin || isSourceManager) &&
        transfer.status === TransferStatus.APPROVED;
    const canReceive =
        (isAdmin || isDestinationManager) &&
        transfer.status === TransferStatus.IN_TRANSIT;

    return {
        canApproveOrReject,
        canCancel,
        canShip,
        canReceive,
        hasAnyAction:
            canApproveOrReject || canCancel || canShip || canReceive,
    };
}
