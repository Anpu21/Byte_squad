import Pill, { type PillTone } from '@/components/ui/Pill';
import type { CreditAccountStatus } from '@/types';

const STATUS_META: Record<
  CreditAccountStatus,
  { tone: PillTone; label: string }
> = {
  PENDING: { tone: 'warning', label: 'Pending' },
  ACTIVE: { tone: 'success', label: 'Active' },
  REJECTED: { tone: 'danger', label: 'Rejected' },
  SUSPENDED: { tone: 'neutral', label: 'Suspended' },
  CLOSED: { tone: 'neutral', label: 'Closed' },
};

interface CreditAccountStatusPillProps {
  status: CreditAccountStatus;
}

/** Status pill for a credit account, covering the full khata lifecycle. */
export function CreditAccountStatusPill({
  status,
}: CreditAccountStatusPillProps) {
  const meta = STATUS_META[status] ?? { tone: 'neutral', label: status };
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}
