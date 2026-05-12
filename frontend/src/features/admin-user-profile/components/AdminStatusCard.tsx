import type { IUserProfile } from '@/types';

interface AdminStatusCardProps {
    profile: IUserProfile | undefined;
}

export function AdminStatusCard({ profile }: AdminStatusCardProps) {
    return (
        <div className="bg-surface border border-border rounded-md p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm">
                <span className="text-text-2">Status</span>
                <span className="text-text-1 font-medium flex items-center gap-1.5">
                    {profile?.isVerified ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Verified
                        </>
                    ) : (
                        <>
                            <span className="w-2 h-2 rounded-full bg-warning" />
                            <span className="text-warning">Pending</span>
                        </>
                    )}
                </span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-text-2">Member Since</span>
                <span className="text-text-1 font-medium">
                    {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(
                              'en-US',
                              { month: 'short', year: 'numeric' },
                          )
                        : '—'}
                </span>
            </div>
        </div>
    );
}
