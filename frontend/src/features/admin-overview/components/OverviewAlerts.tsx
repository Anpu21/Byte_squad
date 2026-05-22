import type { IOverviewAlert } from '@/types';
import { alertTone } from '../lib/alert-tone';

interface OverviewAlertsProps {
    alerts: IOverviewAlert[];
}

export function OverviewAlerts({ alerts }: OverviewAlertsProps) {
    return (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="p-5 border-b border-border">
                <h2 className="text-sm font-bold text-text-1 uppercase tracking-widest">
                    Alerts
                </h2>
            </div>
            <div className="p-5 space-y-2">
                {alerts.length === 0 ? (
                    <p className="text-sm text-text-3">
                        All systems nominal — no active alerts.
                    </p>
                ) : (
                    alerts.map((a, idx) => (
                        <div
                            key={`${a.branchId}-${a.type}-${idx}`}
                            className={`border rounded-lg px-4 py-3 text-sm ${alertTone(a.type)}`}
                        >
                            {a.message}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
