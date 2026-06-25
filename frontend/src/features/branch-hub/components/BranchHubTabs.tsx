import {
    LuBuilding2 as Building2,
    LuGitCompareArrows as GitCompareArrows,
    LuStore as Store,
} from 'react-icons/lu';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import type { BranchHubTab } from '../hooks/useBranchHubTab';

interface BranchHubTabsProps {
    active: BranchHubTab;
    onChange: (tab: BranchHubTab) => void;
}

export function BranchHubTabs({ active, onChange }: BranchHubTabsProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const tabs: TabItem<BranchHubTab>[] = [
        {
            key: 'overview',
            label: isAdmin ? 'Directory' : 'My Branch',
            Icon: isAdmin ? Building2 : Store,
        },
        { key: 'compare', label: 'Compare', Icon: GitCompareArrows },
    ];

    return (
        <Tabs
            tabs={tabs}
            active={active}
            onChange={onChange}
            ariaLabel="Branch hub views"
        />
    );
}
