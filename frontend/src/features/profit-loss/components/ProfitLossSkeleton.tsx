import Card from '@/components/ui/Card';

export function ProfitLossSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                    <div className="h-5 w-40 bg-surface-2 rounded animate-pulse mb-4" />
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
                        <div className="h-4 w-3/4 bg-surface-2 rounded animate-pulse" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
