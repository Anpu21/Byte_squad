import type { PillTone } from '@/components/ui/Pill'
import type { IExpirySeverity } from '@/types'

export function severityTone(severity: IExpirySeverity): PillTone {
  switch (severity) {
    case 'expired':
      return 'danger'
    case 'critical':
      return 'danger'
    case 'warning':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function severityLabel(severity: IExpirySeverity): string {
  switch (severity) {
    case 'expired':
      return 'Expired'
    case 'critical':
      return 'Critical'
    case 'warning':
      return 'Warning'
    default:
      return 'OK'
  }
}

/** Human "X days left" / "expired N days ago" label. */
export function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d ago`
  if (days === 0) return 'Today'
  return `${days}d left`
}
