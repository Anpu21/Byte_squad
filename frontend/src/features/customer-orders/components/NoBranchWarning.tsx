import { AlertTriangle } from 'lucide-react';

export function NoBranchWarning() {
    return (
        <div
            role="alert"
            className="mb-4 p-3 rounded-md bg-warning-soft border border-warning/40 text-text-1 text-sm flex items-start gap-2"
        >
            <AlertTriangle
                size={16}
                className="text-warning flex-shrink-0 mt-0.5"
            />
            <div>
                <p className="font-semibold">
                    Your account isn't assigned to a branch yet.
                </p>
                <p className="text-xs text-text-2 mt-0.5">
                    Pickup orders are filtered to your branch — please contact
                    an admin to assign one before orders will appear here.
                </p>
            </div>
        </div>
    );
}
