/**
 * A member's role within a customer shopping group. The creator is the single
 * OWNER (manages members + the group); everyone who joins by code is a MEMBER.
 * Stored varchar-backed (not a PG enum) — see CustomerGroupStatus.
 */
export enum CustomerGroupMemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}
