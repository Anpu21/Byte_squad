import {
    LuBuilding2 as Building2,
    LuGitCompareArrows as GitCompareArrows,
    LuStore as Store,
} from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { WorkspacePage, type TabItem } from '@/components/ui';
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

    // No hub-level title: the sub-pages own rich headers (Branch directory's
    // create action, Compare's export menu + metric switch), so the sticky tab
    // band renders without a duplicate title above them.
    const tabs: TabItem<BranchHubTab>[] = [
        {
            key: 'overview',
            label: isAdmin ? 'Directory' : 'My Branch',
            Icon: isAdmin ? Building2 : Store,
        },
        { key: 'compare', label: 'Compare', Icon: GitCompareArrows },
    ];

    return (
        <WorkspacePage
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Branch hub views"
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
