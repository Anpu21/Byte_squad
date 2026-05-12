import Card from '@/components/ui/Card';

interface InventoryHeroKpiProps {
    activeProducts: number;
    categoriesCount: number;
}

export function InventoryHeroKpi({
    activeProducts,
    categoriesCount,
}: InventoryHeroKpiProps) {
    return (
        <Card className="p-6 border-l-2 border-l-accent mb-3">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                        Active products
                    </p>
                    <p className="mono text-4xl font-semibold text-text-1 tracking-tight leading-none">
                        {activeProducts}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">
                        Categories
                    </p>
                    <p className="mono text-2xl font-semibold text-text-1 mt-1">
                        {categoriesCount}
                    </p>
                </div>
            </div>
        </Card>
    );
}
