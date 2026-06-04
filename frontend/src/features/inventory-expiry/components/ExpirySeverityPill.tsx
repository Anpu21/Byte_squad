import Pill from '@/components/ui/Pill'
import type { IExpirySeverity } from '@/types'
import { severityTone, severityLabel } from '../lib/severity'

export function ExpirySeverityPill({
  severity,
}: {
  severity: IExpirySeverity
}) {
  return <Pill tone={severityTone(severity)}>{severityLabel(severity)}</Pill>
}
