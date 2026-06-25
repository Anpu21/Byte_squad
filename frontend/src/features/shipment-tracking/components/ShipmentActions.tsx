import { useState, type ReactNode } from 'react';
import { LuMapPin as MapPin, LuNavigation as Navigation, LuPackageCheck as PackageCheck, LuTruck as Truck, LuUndo2 as Undo2, LuUserPlus as UserPlus, LuCircleX as XCircle } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { ShipmentStatus, UserRole } from '@/constants/enums';
import type { IShipment } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useShipmentActions } from '@/features/shipment-tracking/hooks/useShipmentActions';
import { ShipmentActionModal } from '@/features/shipment-tracking/components/ShipmentActionModal';

type ModalMode = 'assign' | 'checkpoint' | 'return' | 'cancel';

/**
 * Role + status aware action bar for a shipment. Mirrors the backend RBAC:
 * source-side managers/admin assign + dispatch + cancel, the assigned courier
 * drives transit, destination-side confirms delivery.
 */
export function ShipmentActions({ shipment }: { shipment: IShipment }) {
    const { user } = useAuth();
    const actions = useShipmentActions(shipment.id);
    const [mode, setMode] = useState<ModalMode | null>(null);

    const isAdmin = user?.role === UserRole.ADMIN;
    const isSourceMgr =
        user?.role === UserRole.MANAGER &&
        user?.branchId === shipment.sourceBranchId;
    const isDestMgr =
        user?.role === UserRole.MANAGER &&
        user?.branchId === shipment.destinationBranchId;
    const isCourier =
        user?.role === UserRole.WORKER &&
        Boolean(shipment.courier) &&
        shipment.courier?.userId === user?.id;

    const canAssign = isAdmin || isSourceMgr;
    const canCancel = isAdmin || isSourceMgr;
    const canSourceSide = isAdmin || isSourceMgr || isCourier;
    const canDeliver = isAdmin || isDestMgr || isCourier;

    const { status } = shipment;
    const disabled = actions.isPending;
    const buttons: ReactNode[] = [];

    if (
        status === ShipmentStatus.PENDING ||
        status === ShipmentStatus.READY_TO_SHIP
    ) {
        if (canAssign) {
            buttons.push(
                <Button
                    key="assign"
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => setMode('assign')}
                >
                    <UserPlus size={14} />
                    {shipment.courierEmployeeId ? 'Reassign courier' : 'Assign courier'}
                </Button>,
            );
        }
        if (
            canSourceSide &&
            status === ShipmentStatus.READY_TO_SHIP &&
            shipment.courierEmployeeId
        ) {
            buttons.push(
                <Button
                    key="dispatch"
                    size="sm"
                    disabled={disabled}
                    onClick={() => actions.dispatch.mutate()}
                >
                    <Truck size={14} /> Dispatch
                </Button>,
            );
        }
        if (canCancel) {
            buttons.push(
                <Button
                    key="cancel"
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => setMode('cancel')}
                >
                    <XCircle size={14} /> Cancel
                </Button>,
            );
        }
    } else if (status === ShipmentStatus.DISPATCHED) {
        if (canSourceSide) {
            buttons.push(
                <Button
                    key="checkpoint"
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => setMode('checkpoint')}
                >
                    <MapPin size={14} /> Add checkpoint
                </Button>,
                <Button
                    key="ofd"
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => actions.outForDelivery.mutate()}
                >
                    <Navigation size={14} /> Out for delivery
                </Button>,
            );
        }
        if (canDeliver) {
            buttons.push(
                <Button
                    key="deliver"
                    size="sm"
                    disabled={disabled}
                    onClick={() => actions.deliver.mutate()}
                >
                    <PackageCheck size={14} /> Mark delivered
                </Button>,
            );
        }
        if (canSourceSide) {
            buttons.push(
                <Button
                    key="return"
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => setMode('return')}
                >
                    <Undo2 size={14} /> Return
                </Button>,
            );
        }
    } else if (status === ShipmentStatus.OUT_FOR_DELIVERY) {
        if (canDeliver) {
            buttons.push(
                <Button
                    key="deliver"
                    size="sm"
                    disabled={disabled}
                    onClick={() => actions.deliver.mutate()}
                >
                    <PackageCheck size={14} /> Mark delivered
                </Button>,
            );
        }
        if (canSourceSide) {
            buttons.push(
                <Button
                    key="return"
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => setMode('return')}
                >
                    <Undo2 size={14} /> Return
                </Button>,
            );
        }
    }

    if (buttons.length === 0) return null;

    return (
        <div className="border border-border rounded-xl bg-surface p-4 flex flex-wrap gap-2">
            {buttons}
            {mode && (
                <ShipmentActionModal
                    mode={mode}
                    shipment={shipment}
                    actions={actions}
                    onClose={() => setMode(null)}
                />
            )}
        </div>
    );
}
