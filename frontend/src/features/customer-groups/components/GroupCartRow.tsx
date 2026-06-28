import {
    LuMinus as Minus,
    LuPlus as Plus,
    LuTrash2 as Trash2,
    LuImageOff as ImageOff,
} from 'react-icons/lu'
import Pill from '@/components/ui/Pill'
import { formatCurrency } from '@/lib/utils'
import type { IGroupCartItemView } from '@/types'

interface GroupCartRowProps {
    item: IGroupCartItemView
    onSetQty: (itemId: string, quantity: number) => void
    onRemove: (itemId: string) => void
    disabled?: boolean
}

export function GroupCartRow({
    item,
    onSetQty,
    onRemove,
    disabled,
}: GroupCartRowProps) {
    // "Buy by amount" lines have a derived quantity — stepping it makes no sense,
    // so they (and unavailable products) show a static quantity + remove only.
    const isAmountLine = item.amount != null
    const canStep = item.available && !isAmountLine

    return (
        <li className="flex items-center gap-3 px-5 py-3.5">
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2">
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-3">
                        <ImageOff size={16} />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-1">
                    {item.productName}
                </p>
                <p className="truncate text-xs text-text-3">
                    {item.branchName}
                    {item.unitLabel ? ` · ${item.unitLabel}` : ''}
                </p>
                {!item.available && (
                    <Pill tone="danger" className="mt-1">
                        Unavailable
                    </Pill>
                )}
            </div>

            <div className="flex flex-col items-end gap-1.5">
                <span className="text-sm font-semibold tabular-nums text-text-1">
                    {formatCurrency(item.lineTotal)}
                </span>
                <div className="flex items-center gap-1.5">
                    {canStep ? (
                        <div className="inline-flex items-center rounded-md border border-border">
                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={disabled || item.quantity <= 1}
                                onClick={() =>
                                    onSetQty(item.id, item.quantity - 1)
                                }
                                className="p-1.5 text-text-2 transition-colors hover:text-text-1 disabled:opacity-40"
                            >
                                <Minus size={13} />
                            </button>
                            <span className="min-w-[28px] text-center text-xs font-semibold tabular-nums text-text-1">
                                {item.quantity}
                            </span>
                            <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={disabled}
                                onClick={() =>
                                    onSetQty(item.id, item.quantity + 1)
                                }
                                className="p-1.5 text-text-2 transition-colors hover:text-text-1 disabled:opacity-40"
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs tabular-nums text-text-3">
                            {isAmountLine
                                ? `≈ ${item.quantity}`
                                : `× ${item.quantity}`}
                        </span>
                    )}
                    <button
                        type="button"
                        aria-label={`Remove ${item.productName}`}
                        disabled={disabled}
                        onClick={() => onRemove(item.id)}
                        className="rounded-md p-1.5 text-text-3 transition-colors hover:bg-danger-soft hover:text-danger focus:outline-none focus-visible:ring-[3px] focus-visible:ring-danger/30 disabled:opacity-40"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
        </li>
    )
}
