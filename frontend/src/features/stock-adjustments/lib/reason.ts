import type { PillTone } from '@/components/ui/Pill'
import type {
  IStockAdjustmentReason,
  IStockAdjustmentStatus,
} from '@/types'

export const REASON_OPTIONS: { value: IStockAdjustmentReason; label: string }[] =
  [
    { value: 'Stock_Take', label: 'Stock take' },
    { value: 'Damage', label: 'Damage' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Theft', label: 'Theft' },
    { value: 'Other', label: 'Other' },
  ]

export function reasonLabel(reason: IStockAdjustmentReason): string {
  return REASON_OPTIONS.find((r) => r.value === reason)?.label ?? reason
}

export function statusTone(status: IStockAdjustmentStatus): PillTone {
  switch (status) {
    case 'Approved':
      return 'success'
    case 'Pending':
      return 'warning'
    default:
      return 'neutral'
  }
}
