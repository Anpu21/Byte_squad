/** A conversation participant's read cursor, used for read receipts. */
export interface IChatParticipantRead {
  userId: string
  lastReadAt: string | null
}
