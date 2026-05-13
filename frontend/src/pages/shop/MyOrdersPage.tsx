import { OrderDetailsModal } from '@/components/shop/OrderDetailsModal';
import { useMyOrdersPage } from '@/features/my-orders/hooks/useMyOrdersPage';
import { MyOrdersEmpty } from '@/features/my-orders/components/MyOrdersEmpty';
import { MyOrdersTable } from '@/features/my-orders/components/MyOrdersTable';
import { MyOrdersCardList } from '@/features/my-orders/components/MyOrdersCardList';

export function MyOrdersPage() {
    const p = useMyOrdersPage();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    My pickup orders
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    Past and pending orders. Tap "View" to see the QR and full
                    order details without leaving this page.
                </p>
            </div>

            {p.isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>
            ) : p.requests.length === 0 ? (
                <MyOrdersEmpty />
            ) : (
                <>
                    <MyOrdersTable
                        requests={p.requests}
                        onView={p.openDetails}
                        onCancel={p.onCancel}
                    />
                    <MyOrdersCardList
                        requests={p.requests}
                        onView={p.openDetails}
                        onCancel={p.onCancel}
                    />
                </>
            )}

            <OrderDetailsModal
                isOpen={!!p.selectedRequestId}
                onClose={p.closeDetails}
                request={p.selectedRequest}
            />
        </div>
    );
}
