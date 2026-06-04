import Pill from '@/components/ui/Pill'
import type { IStockAdjustmentStatus } from '@/types'
import { statusTone } from '../lib/reason'

export function AdjustmentStatusPill({
  status,
}: {
  status: IStockAdjustmentStatus
}) {
  return <Pill tone={statusTone(status)}>{status}</Pill>
}
