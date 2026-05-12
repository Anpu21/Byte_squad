import { StaffRequestDetailsModal } from '@/components/requests/StaffRequestDetailsModal';
import { useCustomerRequestsPage } from '@/features/customer-requests/hooks/useCustomerRequestsPage';
import { CustomerRequestsHeader } from '@/features/customer-requests/components/CustomerRequestsHeader';
import { NoBranchWarning } from '@/features/customer-requests/components/NoBranchWarning';
import { CustomerRequestsKpis } from '@/features/customer-requests/components/CustomerRequestsKpis';
import { CustomerRequestsTable } from '@/features/customer-requests/components/CustomerRequestsTable';

export default function CustomerRequestsPage() {
    const p = useCustomerRequestsPage();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CustomerRequestsHeader
                isAdmin={p.isAdmin}
                isCashier={p.isCashier}
                userBranchId={p.user?.branchId}
                profileBranchName={p.profileBranchName}
            />

            {p.needsBranchAssignment && <NoBranchWarning />}

            <CustomerRequestsKpis kpis={p.kpis} />

            <CustomerRequestsTable
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

            <StaffRequestDetailsModal
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
