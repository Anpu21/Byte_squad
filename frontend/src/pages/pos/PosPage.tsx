import Card from '@/components/ui/Card';

export function PosPage() {
    return (
        <div className="min-h-[calc(100dvh-6.5rem)] flex items-center justify-center">
            <Card className="max-w-md text-center p-8">
                <h1 className="text-2xl font-semibold text-text-1">
                    POS rebuild in progress
                </h1>
                <p className="mt-3 text-sm text-text-2">
                    The cashier point-of-sale workspace is being rebuilt against
                    the Shanel ERP reference. The route remains reachable so
                    navigation works; the workspace will return in Phase 14.
                </p>
            </Card>
        </div>
    );
}
