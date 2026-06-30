import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { IChatMessageView } from '@/types'
import { Tabs } from '@/components/ui'
import { GROUP_TABS } from '../components/group-detail-tabs'
import { countUnread } from '../lib/group-chat-unread'

const ME = 'u1'
const OTHER = 'u2'

let seq = 0
const mk = (senderId: string): IChatMessageView =>
  ({
    id: `m${seq++}`,
    conversationId: 'c1',
    senderId,
    body: 'hi',
    attachments: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'sent',
  }) as IChatMessageView

describe('countUnread', () => {
  it('counts only messages from others past the seen baseline', () => {
    const msgs = [mk(OTHER), mk(ME), mk(OTHER), mk(OTHER)]
    expect(countUnread(msgs, ME, 0)).toBe(3)
  })

  it('treats everything up to the baseline as already seen', () => {
    const msgs = [mk(OTHER), mk(OTHER)]
    expect(countUnread(msgs, ME, msgs.length)).toBe(0)
  })

  it('counts only the tail after a partial baseline', () => {
    const msgs = [mk(OTHER), mk(OTHER), mk(OTHER)]
    expect(countUnread(msgs, ME, 1)).toBe(2)
  })

  it('ignores the current user’s own messages', () => {
    expect(countUnread([mk(ME), mk(ME)], ME, 0)).toBe(0)
  })

  it('is safe with an empty list or out-of-range baseline', () => {
    expect(countUnread([], ME, 0)).toBe(0)
    expect(countUnread([mk(OTHER)], ME, 5)).toBe(0)
  })
})

describe('GROUP_TABS', () => {
  it('renders all six group sections and reports the selected tab', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Tabs
        tabs={GROUP_TABS}
        active="overview"
        onChange={onChange}
        variant="underline"
        ariaLabel="Group sections"
      />,
    )

    for (const label of [
      'Overview',
      'Cart',
      'Chat',
      'Members',
      'Invite',
      'Analytics',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }

    await user.click(screen.getByRole('tab', { name: 'Chat' }))
    expect(onChange).toHaveBeenCalledWith('chat')
  })
})
