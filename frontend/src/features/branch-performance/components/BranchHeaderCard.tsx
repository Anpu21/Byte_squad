import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import type { IMyBranchPerformance } from '@/types';

interface BranchHeaderCardProps {
    branch: IMyBranchPerformance['branch'];
    admin: IMyBranchPerformance['admin'];
}

export function BranchHeaderCard({ branch, admin }: BranchHeaderCardProps) {
    return (
        <Card className="p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                            {branch.name}
                        </h1>
                        <Pill tone={branch.isActive ? 'success' : 'neutral'}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                        </Pill>
                    </div>
                    <p className="text-sm text-text-2">
                        {branch.address}
                        {admin && (
                            <span>
                                {' '}
                                · Manager:{' '}
                                <span className="text-text-1 font-medium">
                                    {admin.name}
                                </span>
                            </span>
                        )}
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">{branch.phone}</p>
                </div>
            </div>
        </Card>
    );
}
