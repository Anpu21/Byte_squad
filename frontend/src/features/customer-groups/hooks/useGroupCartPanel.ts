import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppDispatch } from '@/store/hooks'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/lib/utils'
import { useConfirm } from '@/hooks/useConfirm'
import { setGroupShopContext } from '@/store/slices/shopContextSlice'
import { useGroupCart } from '@/features/customer-groups/hooks/useGroupCart'
import { useGroupCartLiveSync } from '@/features/customer-groups/hooks/useGroupCartLiveSync'
import { useSetGroupCartItemQty } from '@/features/customer-groups/hooks/useSetGroupCartItemQty'
import { useRemoveGroupCartItem } from '@/features/customer-groups/hooks/useRemoveGroupCartItem'
import { useClearGroupCart } from '@/features/customer-groups/hooks/useClearGroupCart'
import { useGroupCheckout } from '@/features/customer-groups/hooks/useGroupCheckout'

export function useGroupCartPanel(groupId: string, groupName: string) {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const confirm = useConfirm()

    const { data: cart, isLoading } = useGroupCart(groupId)
    // Refetch live whenever any member changes the cart.
    useGroupCartLiveSync(groupId)

    const setQty = useSetGroupCartItemQty()
    const removeItem = useRemoveGroupCartItem()
    const clear = useClearGroupCart()
    const checkout = useGroupCheckout()

    const onShopForGroup = () => {
        dispatch(setGroupShopContext({ groupId, groupName }))
        navigate(FRONTEND_ROUTES.SHOP)
    }

    const onSetQty = (itemId: string, quantity: number) => {
        if (quantity < 1) return
        setQty.mutate(
            { id: groupId, itemId, payload: { quantity } },
            { onError: () => toast.error('Could not update quantity') },
        )
    }

    const onRemove = (itemId: string) => {
        removeItem.mutate(
            { id: groupId, itemId },
            { onError: () => toast.error('Could not remove the item') },
        )
    }

    const onClear = async () => {
        const ok = await confirm({
            title: 'Clear the shared cart?',
            body: 'This removes every item for everyone in the group.',
            confirmLabel: 'Clear cart',
            cancelLabel: 'Keep items',
            tone: 'danger',
        })
        if (!ok) return
        clear.mutate(groupId, {
            onError: () => toast.error('Could not clear the cart'),
        })
    }

    const onCheckout = async () => {
        if (!cart || cart.items.length === 0) return
        const ok = await confirm({
            title: 'Check out the group cart?',
            body: `You'll pay for the whole cart (${formatCurrency(cart.total)}). Each branch's items are picked up at that branch.`,
            confirmLabel: 'Pay now',
            cancelLabel: 'Not yet',
        })
        if (!ok) return
        try {
            const itemCount = cart.itemCount
            const result = await checkout.mutateAsync({
                id: groupId,
                payload: { paymentMode: 'online' },
            })
            if (result.payment) {
                const finalTotal = result.orders.reduce(
                    (sum, o) => sum + Number(o.finalTotal),
                    0,
                )
                // Hand the PayHere payload to the gateway page exactly like the
                // personal checkout (router location.state → auto-submitting form).
                navigate(FRONTEND_ROUTES.SHOP_CHECKOUT_PAY, {
                    state: {
                        payment: result.payment,
                        orderCode:
                            result.orders[0]?.orderCode ?? result.groupCode,
                        branchName:
                            result.orders.length === 1
                                ? (result.orders[0]?.branch?.name ?? '')
                                : `${result.orders.length} branches`,
                        finalTotal,
                        itemCount,
                    },
                })
            } else {
                toast.success('Order placed')
                navigate(FRONTEND_ROUTES.SHOP_MY_ORDERS)
            }
        } catch {
            toast.error('Checkout failed. Please try again.')
        }
    }

    return {
        cart,
        isLoading,
        onShopForGroup,
        onSetQty,
        onRemove,
        onClear,
        onCheckout,
        checkingOut: checkout.isPending,
        clearing: clear.isPending,
        mutating: setQty.isPending || removeItem.isPending,
    }
}
