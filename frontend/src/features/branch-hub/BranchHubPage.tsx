import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { WorkspacePage } from '@/components/ui';
import { useNavTabs } from '@/config/navigation';
import {
    useBranchHubTab,
    type BranchHubTab,
} from '@/features/branch-hub/hooks/useBranchHubTab';
import { BranchManagementPage } from '@/features/branch-management';
import { BranchPerformancePage } from '@/features/branch-performance';
import { BranchComparisonPage } from '@/features/branch-comparison';

export function BranchHubPage() {
    const { user } = useAuth();
    const { tab, setTab } = useBranchHubTab();
    const isAdmin = user?.role === UserRole.ADMIN;

    // Tabs (including the role-varying "Directory" / "My Branch" label + icon)
    // come from the central navigation config. No hub-level title: the sub-pages
    // own rich headers (Branch directory's create action, Compare's export menu
    // + metric switch), so the sticky tab band renders without a duplicate title.
    const tabs = useNavTabs<BranchHubTab>('branches');

    return (
        <WorkspacePage
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Branch hub views"
            chromeless
        >
            {tab === 'overview' &&
                (isAdmin ? (
                    <BranchManagementPage embedded={false} />
                ) : (
                    <BranchPerformancePage />
                ))}
            {tab === 'compare' && <BranchComparisonPage embedded={false} />}
        </WorkspacePage>
    );
}
