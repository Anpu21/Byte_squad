export enum CustomerOrderStatus {
  PENDING = 'pending',
  /** @deprecated Legacy manager-approval state; no longer produced. */
  ACCEPTED = 'accepted',
  /** Picked up by the customer (fulfilled). Shown to staff as "Collected". */
  COMPLETED = 'completed',
  /** No-show — the customer never collected the order. */
  NOT_COLLECTED = 'not_collected',
  /** @deprecated Legacy manager-rejection state; no longer produced. */
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
