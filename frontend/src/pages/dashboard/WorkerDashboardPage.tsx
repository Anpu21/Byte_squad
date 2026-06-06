import { useWorkerDashboard } from '@/features/worker-dashboard/hooks/useWorkerDashboard';
import { WorkerShiftCard } from '@/features/worker-dashboard/components/WorkerShiftCard';
import { WorkerKpis } from '@/features/worker-dashboard/components/WorkerKpis';
import { WorkerRecentAttendance } from '@/features/worker-dashboard/components/WorkerRecentAttendance';
import { WorkerDeliveriesCard } from '@/features/worker-dashboard/components/WorkerDeliveriesCard';
import { useShipmentsQuery } from '@/features/shipment-tracking/hooks/useShipmentsQuery';
import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';
import { getTodayLabel } from '@/features/admin-dashboard/lib/format';

export function WorkerDashboardPage() {
    const p = useWorkerDashboard();
    const deliveries = useShipmentsQuery();
    useStockTransferRealtime();

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1">
                    Hi {p.user?.firstName ?? 'there'}
                </h1>
                <p className="text-xs text-text-2 mt-1">{getTodayLabel()}</p>
            </div>

            {p.isError ? (
                <div className="bg-surface border border-border rounded-md shadow-xs p-8 text-center text-sm text-text-3">
                    We couldn't load your attendance. Your account may not be
                    linked to an employee profile yet — ask an admin to set this
                    up.
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <WorkerShiftCard
                            today={p.metrics.today}
                            isMutating={p.isMutating}
                            onCheckIn={p.checkIn}
                            onCheckOut={p.checkOut}
                        />
                    </div>

                    <WorkerKpis metrics={p.metrics} />

                    <WorkerRecentAttendance rows={p.rows} />
                </>
            )}

            <WorkerDeliveriesCard shipments={deliveries.data?.items ?? []} />
        </div>
    );
}
