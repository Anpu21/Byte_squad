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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BranchHubTabs active={tab} onChange={setTab} />

            {tab === 'overview' && (
                isAdmin ? (
                    <BranchManagementPage embedded={false} />
                ) : (
                    <BranchPerformancePage />
                )
            )}

            {tab === 'compare' && <BranchComparisonPage embedded={false} />}
        </div>
    );
}
