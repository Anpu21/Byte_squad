/**
 * Lifecycle of a customer shopping group. Stored varchar-backed (not a PG enum)
 * so adding a state later doesn't trip the DB_SYNC enum-narrowing footgun in dev.
 */
export enum CustomerGroupStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}
