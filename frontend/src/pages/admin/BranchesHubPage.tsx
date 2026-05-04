import { useState } from 'react';
import OverviewPage from '@/pages/admin/OverviewPage';
import BranchComparisonPage from '@/pages/admin/BranchComparisonPage';
import BranchManagementPage from '@/pages/branches/BranchManagementPage';

type HubTab = 'overview' | 'manage' | 'compare';

const TABS: { key: HubTab; label: string; description: string }[] = [
    {
        key: 'overview',
        label: 'Overview',
        description: 'System-wide alerts and branch performance',
    },
    {
        key: 'manage',
        label: 'Manage',
        description: 'Create, edit, and toggle branches',
    },
    {
        key: 'compare',
        label: 'Compare',
        description: 'Side-by-side branch analytics',
    },
];

export default function BranchesHubPage() {
    const [tab, setTab] = useState<HubTab>('overview');
    const active = TABS.find((t) => t.key === tab) ?? TABS[0];

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Branches
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    {active.description}
                </p>
            </div>

            <div className="flex items-center gap-1 mb-6 p-1 bg-white/[0.03] rounded-xl border border-white/5 w-fit">
                {TABS.map((t) => {
                    const isActive = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                                isActive
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === 'overview' && <OverviewPage embedded />}
            {tab === 'manage' && <BranchManagementPage embedded />}
            {tab === 'compare' && <BranchComparisonPage embedded />}
        </div>
    );
}
