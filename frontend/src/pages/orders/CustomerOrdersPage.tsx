import { StaffOrderDetailsModal } from '@/components/orders/StaffOrderDetailsModal';
import { useCustomerOrdersPage } from '@/features/customer-orders/hooks/useCustomerOrdersPage';
import { CustomerOrdersHeader } from '@/features/customer-orders/components/CustomerOrdersHeader';
import { NoBranchWarning } from '@/features/customer-orders/components/NoBranchWarning';
import { CustomerOrdersKpis } from '@/features/customer-orders/components/CustomerOrdersKpis';
import { CustomerOrdersTable } from '@/features/customer-orders/components/CustomerOrdersTable';

export function CustomerOrdersPage() {
    const p = useCustomerOrdersPage();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CustomerOrdersHeader
                isAdmin={p.isAdmin}
                isCashier={p.isCashier}
                userBranchId={p.user?.branchId}
                profileBranchName={p.profileBranchName}
            />

            {p.needsBranchAssignment && <NoBranchWarning />}

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
                canReview={p.canReview}
                onView={p.setSelectedRequestId}
                onAccept={p.onAccept}
                onReject={p.onReject}
            />

            <StaffOrderDetailsModal
                isOpen={!!p.selectedRequestId}
                onClose={() => p.setSelectedRequestId(null)}
                request={p.selectedRequest}
                canReview={
                    p.selectedRequest
                        ? p.canReview(p.selectedRequest.branchId)
                        : false
                }
                onAccept={p.onAccept}
                onReject={p.onReject}
                actionPending={p.actionPending}
            />
        </div>
    );
}
