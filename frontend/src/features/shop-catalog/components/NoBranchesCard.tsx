import { Store } from 'lucide-react';

export function NoBranchesCard() {
    return (
        <div className="max-w-md mx-auto py-16">
            <div className="bg-surface border border-border rounded-md p-7 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 border border-border mb-4">
                    <Store size={20} className="text-text-1" />
                </div>
                <h1 className="text-xl font-bold text-text-1 tracking-tight mb-1">
                    No branches available
                </h1>
                <p className="text-sm text-text-2">Please check back later.</p>
            </div>
        </div>
    );
}
