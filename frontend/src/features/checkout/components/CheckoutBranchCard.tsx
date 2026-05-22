import { Link } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IShopBranch } from '@/types';

interface CheckoutBranchCardProps {
    branch: IShopBranch | null;
}

export function CheckoutBranchCard({ branch }: CheckoutBranchCardProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-xs uppercase tracking-widest text-text-3">
                    Pickup branch
                </label>
                <Link
                    to={FRONTEND_ROUTES.SHOP}
                    className="text-[11px] text-text-2 hover:text-text-1 underline-offset-4 hover:underline"
                >
                    Change branch
                </Link>
            </div>
            <div className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm">
                {branch ? (
                    <>
                        <p className="text-text-1 font-medium">{branch.name}</p>
                        <p className="text-text-2 text-xs mt-0.5">
                            {branch.address}
                        </p>
                    </>
                ) : (
                    <p className="text-text-3">Loading branch…</p>
                )}
            </div>
        </div>
    );
}
