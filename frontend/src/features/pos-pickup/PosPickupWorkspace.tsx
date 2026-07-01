import { CustomerOrdersKpis } from '@/features/customer-orders/components/CustomerOrdersKpis';
import { CustomerOrdersTable } from '@/features/customer-orders/components/CustomerOrdersTable';
import { NoBranchWarning } from '@/features/customer-orders/components/NoBranchWarning';
import { usePosPickup } from './hooks/usePosPickup';
import { PosPickupToolbar } from './components/PosPickupToolbar';
import { PosPickupScanModal } from './components/PosPickupScanModal';
import { PosPickupFulfillModal } from './components/PosPickupFulfillModal';

/**
 * POS "Pickup" workspace: a live, branch-scoped queue of customer pickup
 * orders with scan / code lookup and in-place fulfillment. Reuses the
 * customer-orders table, KPIs, and live-notification socket; a scan, a code
 * lookup, or a queue row all open the same fulfillment modal.
 */
export function PosPickupWorkspace() {
    const p = usePosPickup();

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {p.needsBranchAssignment && <NoBranchWarning />}

            <PosPickupToolbar
                onScan={p.openScan}
                manualCode={p.manualCode}
                setManualCode={p.setManualCode}
                onSubmit={p.handleManualSubmit}
                looking={p.looking}
                inputRef={p.manualInputRef}
            />

            <CustomerOrdersKpis kpis={p.kpis} />

            <CustomerOrdersTable
                requests={p.requests}
                isLoading={p.isLoading}
                hasFilters={p.hasFilters}
                isAdmin={p.isAdmin}
                actionPending={p.actionPending}
                search={p.search}
                setSearch={p.setSearch}
                statusFilter={p.statusFilter}
                setStatusFilter={p.setStatusFilter}
                canManage={p.canManage}
                onView={p.openOrderById}
                onCollect={p.openOrder}
                onMarkNotCollected={p.markNotCollected}
            />

            <PosPickupScanModal
                isOpen={p.scanOpen}
                onClose={p.closeScan}
                onScan={p.onScan}
            />

            <PosPickupFulfillModal
                order={p.selectedOrder}
                canManage={
                    p.selectedOrder
                        ? p.canManage(p.selectedOrder.branchId)
                        : false
                }
                isFulfillable={p.fulfillment.isFulfillable}
                requiresPayment={p.fulfillment.requiresPayment}
                isOnlineBlocked={p.fulfillment.isOnlineBlocked}
                submitting={p.fulfillment.submitting}
                actionPending={p.actionPending}
                onConfirm={p.fulfillment.handleConfirm}
                onMarkNotCollected={p.markNotCollected}
                onClose={p.closeOrder}
            />
        </div>
    );
}
