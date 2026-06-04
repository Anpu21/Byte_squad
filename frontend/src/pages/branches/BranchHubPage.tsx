import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { BranchHubTabs } from '@/features/branch-hub/components/BranchHubTabs';
import { useBranchHubTab } from '@/features/branch-hub/hooks/useBranchHubTab';
import { BranchManagementPage } from '@/pages/branches/BranchManagementPage';
import { BranchPerformancePage } from '@/pages/branches/BranchPerformancePage';
import { BranchComparisonPage } from '@/pages/admin/BranchComparisonPage';

export function BranchHubPage() {
    const { user } = useAuth();
    const { tab, setTab } = useBranchHubTab();
    const isAdmin = user?.role === UserRole.ADMIN;

    return (
        <div>
            <BranchHubTabs active={tab} onChange={setTab} />

            {/* Keyed so each tab switch plays exactly one entrance; the single
                animate-in lives here, not in the child pages (avoids double /
                replayed animation). */}
            <div
                key={tab}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
                {tab === 'overview' &&
                    (isAdmin ? (
                        <BranchManagementPage embedded={false} />
                    ) : (
                        <BranchPerformancePage />
                    ))}

                {tab === 'compare' && (
                    <BranchComparisonPage embedded={false} />
                )}
            </div>
        </div>
    );
}
