import { Link } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';

interface CustomerOrdersHeaderProps {
    isAdmin: boolean;
    isCashier: boolean;
    userBranchId: string | null | undefined;
    profileBranchName: string | null;
}

export function CustomerOrdersHeader({
    isAdmin,
    isCashier,
    userBranchId,
    profileBranchName,
}: CustomerOrdersHeaderProps) {
    const subtitle = isAdmin
        ? 'Pickup orders across all branches. Auto-refreshes every 30 seconds.'
        : 'Pickup orders at your branch. Auto-refreshes every 30 seconds.';
    const branchShortId = userBranchId ? userBranchId.slice(0, 8) : null;

    return (
        <div className="flex items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Customer Orders
                </h1>
                <p className="text-sm text-text-2 mt-1">{subtitle}</p>
                {!isAdmin && userBranchId && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-text-2 bg-surface-2 border border-border rounded-full px-2.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        Showing for:{' '}
                        <span className="text-text-1 font-semibold">
                            {profileBranchName ?? 'your branch'}
                        </span>
                        {branchShortId && (
                            <span className="text-text-3 mono">
                                · {branchShortId}…
                            </span>
                        )}
                    </p>
                )}
            </div>
            {isCashier && (
                <Link to={FRONTEND_ROUTES.SCAN_ORDER}>
                    <Button>
                        <ScanLine size={14} />
                        Scan Pickup
                    </Button>
                </Link>
            )}
        </div>
    );
}
