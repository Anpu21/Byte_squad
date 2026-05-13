import { INVENTORY_PAGE_LIMIT } from '@/hooks/useInventory';
import { useInventoryListPage } from '@/features/inventory-list/hooks/useInventoryListPage';
import { InventoryListHeader } from '@/features/inventory-list/components/InventoryListHeader';
import { InventoryFilterRail } from '@/features/inventory-list/components/InventoryFilterRail';
import { InventoryHeroKpi } from '@/features/inventory-list/components/InventoryHeroKpi';
import { ActiveFilterChips } from '@/features/inventory-list/components/ActiveFilterChips';
import { InventoryList } from '@/features/inventory-list/components/InventoryList';
import { InventoryPagination } from '@/features/inventory-list/components/InventoryPagination';

export function InventoryListPage() {
    const p = useInventoryListPage();
    const inv = p.inventory;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <InventoryListHeader
                total={inv.total}
                isExporting={p.isExporting}
                onExport={p.handleExport}
            />

            <div className="flex flex-col lg:flex-row gap-5">
                <InventoryFilterRail
                    search={inv.search}
                    onSearchChange={inv.setSearch}
                    stockStatus={inv.stockStatus}
                    onStockStatusChange={inv.setStockStatus}
                    category={inv.category}
                    onCategoryChange={inv.setCategory}
                    categories={inv.categories}
                    hasActiveFilter={p.hasActiveFilter}
                    onReset={p.resetFilters}
                />

                <div className="flex-1 min-w-0">
                    <InventoryHeroKpi
                        activeProducts={inv.total}
                        categoriesCount={inv.categories.length}
                    />

                    <ActiveFilterChips
                        search={inv.search}
                        setSearch={inv.setSearch}
                        stockStatus={inv.stockStatus}
                        setStockStatus={inv.setStockStatus}
                        category={inv.category}
                        setCategory={inv.setCategory}
                        onResetAll={p.resetFilters}
                        totalMatches={inv.total}
                    />

                    <InventoryList
                        items={inv.items}
                        isLoading={inv.isLoading}
                        hasActiveFilter={p.hasActiveFilter}
                        onResetFilters={p.resetFilters}
                        onDelete={p.deleteProduct}
                    />

                    <InventoryPagination
                        page={inv.page}
                        totalPages={inv.totalPages}
                        total={inv.total}
                        limit={INVENTORY_PAGE_LIMIT}
                        onPageChange={inv.setPage}
                    />
                </div>
            </div>
        </div>
    );
}
