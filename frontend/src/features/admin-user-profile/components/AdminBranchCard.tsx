import type { IUserProfile } from '@/types';

interface AdminBranchCardProps {
    branch: NonNullable<IUserProfile['branch']>;
}

export function AdminBranchCard({ branch }: AdminBranchCardProps) {
    return (
        <div className="bg-surface border border-border rounded-md p-5 shadow-2xl">
            <h3 className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-4">
                Branch
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-text-2">Name</span>
                    <span className="text-text-1 font-medium">{branch.name}</span>
                </div>
                {branch.addressLine1 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-text-2">Address</span>
                        <span className="text-text-1 font-medium text-right max-w-[60%]">
                            {branch.addressLine1}
                        </span>
                    </div>
                )}
                {branch.phone && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-text-2">Phone</span>
                        <span className="text-text-1 font-medium">{branch.phone}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
