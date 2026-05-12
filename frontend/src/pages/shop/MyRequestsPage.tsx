import { RequestDetailsModal } from '@/components/shop/RequestDetailsModal';
import { useMyRequestsPage } from '@/features/my-requests/hooks/useMyRequestsPage';
import { MyRequestsEmpty } from '@/features/my-requests/components/MyRequestsEmpty';
import { MyRequestsTable } from '@/features/my-requests/components/MyRequestsTable';
import { MyRequestsCardList } from '@/features/my-requests/components/MyRequestsCardList';

export function MyRequestsPage() {
    const p = useMyRequestsPage();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    My pickup requests
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    Past and pending requests. Tap "View" to see the QR and full
                    order details without leaving this page.
                </p>
            </div>

            {p.isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>
            ) : p.requests.length === 0 ? (
                <MyRequestsEmpty />
            ) : (
                <>
                    <MyRequestsTable
                        requests={p.requests}
                        onView={p.openDetails}
                        onCancel={p.onCancel}
                    />
                    <MyRequestsCardList
                        requests={p.requests}
                        onView={p.openDetails}
                        onCancel={p.onCancel}
                    />
                </>
            )}

            <RequestDetailsModal
                isOpen={!!p.selectedRequestId}
                onClose={p.closeDetails}
                request={p.selectedRequest}
            />
        </div>
    );
}
