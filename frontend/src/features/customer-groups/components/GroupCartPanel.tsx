import { LuShoppingCart as ShoppingCart, LuPlus as Plus } from 'react-icons/lu'
import Card, {
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils'
import { useGroupCartPanel } from '@/features/customer-groups/hooks/useGroupCartPanel'
import { GroupCartRow } from '@/features/customer-groups/components/GroupCartRow'

interface GroupCartPanelProps {
    groupId: string
    groupName: string
}

export function GroupCartPanel({ groupId, groupName }: GroupCartPanelProps) {
    const p = useGroupCartPanel(groupId, groupName)
    const items = p.cart?.items ?? []
    const total = p.cart?.total ?? 0

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShoppingCart
                        size={16}
                        className="text-text-3"
                        aria-hidden="true"
                    />
                    <CardTitle>Shared cart</CardTitle>
                    {items.length > 0 && (
                        <span className="text-xs font-medium text-text-3">
                            {items.length}
                        </span>
                    )}
                </div>
                <Button size="sm" variant="secondary" onClick={p.onShopForGroup}>
                    <Plus size={15} /> Add products
                </Button>
            </CardHeader>

            {p.isLoading ? (
                <CardContent>
                    <div className="flex items-center justify-center py-10">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
                    </div>
                </CardContent>
            ) : items.length === 0 ? (
                <EmptyState
                    icon={<ShoppingCart size={24} />}
                    title="The cart is empty"
                    description="Add products from the shop — everyone in the group sees them here instantly."
                    action={
                        <Button onClick={p.onShopForGroup}>
                            <Plus size={16} /> Shop for this group
                        </Button>
                    }
                />
            ) : (
                <>
                    <CardContent className="p-0">
                        <ul className="divide-y divide-border">
                            {items.map((item) => (
                                <GroupCartRow
                                    key={item.id}
                                    item={item}
                                    onSetQty={p.onSetQty}
                                    onRemove={p.onRemove}
                                    disabled={p.mutating}
                                />
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-text-2">Total</span>
                            <span className="text-lg font-bold tabular-nums text-text-1">
                                {formatCurrency(total)}
                            </span>
                        </div>
                        <div className="flex gap-2.5">
                            <Button
                                variant="ghost"
                                onClick={p.onClear}
                                disabled={p.clearing}
                                className="flex-1"
                            >
                                Clear
                            </Button>
                            <Button
                                onClick={p.onCheckout}
                                disabled={p.checkingOut}
                                className="flex-[2]"
                            >
                                {p.checkingOut
                                    ? 'Processing…'
                                    : `Checkout · ${formatCurrency(total)}`}
                            </Button>
                        </div>
                    </CardFooter>
                </>
            )}
        </Card>
    )
}
