import { Link } from 'react-router-dom'
import { LuUsers as Users, LuX as X } from 'react-icons/lu'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectShopContext } from '@/store/selectors/shopContext'
import { clearShopContext } from '@/store/slices/shopContextSlice'
import { FRONTEND_ROUTES } from '@/constants/routes'

/**
 * Storefront-wide indicator that "Add to cart" is currently feeding a group's
 * shared cart, with a one-tap switch back to personal. Renders nothing in
 * personal mode.
 */
export function ShopContextBanner() {
    const dispatch = useAppDispatch()
    const ctx = useAppSelector(selectShopContext)

    if (ctx.mode !== 'group' || !ctx.groupId) return null

    const detailPath = FRONTEND_ROUTES.SHOP_GROUP_DETAIL.replace(
        ':id',
        ctx.groupId,
    )

    return (
        <div className="border-b border-primary/20 bg-primary-soft">
            <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2 sm:px-6">
                <Users
                    size={16}
                    className="flex-shrink-0 text-primary-soft-text"
                    aria-hidden="true"
                />
                <p className="flex-1 text-[13px] font-medium text-primary-soft-text">
                    You&apos;re shopping for{' '}
                    <Link
                        to={detailPath}
                        className="font-semibold underline underline-offset-2"
                    >
                        {ctx.groupName ?? 'your group'}
                    </Link>{' '}
                    — items go to the shared cart.
                </p>
                <button
                    type="button"
                    onClick={() => dispatch(clearShopContext())}
                    className="inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary-soft-text transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
                >
                    <X size={13} /> Switch to personal
                </button>
            </div>
        </div>
    )
}
