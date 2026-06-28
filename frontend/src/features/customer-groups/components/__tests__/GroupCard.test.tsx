import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ICustomerGroupSummary } from '@/types'
import { GroupCard } from '../GroupCard'

function group(over: Partial<ICustomerGroupSummary> = {}): ICustomerGroupSummary {
  return {
    id: 'g1',
    name: 'Home',
    joinCode: 'FAM-7Q2K9X4P',
    status: 'active',
    ownerUserId: 'u1',
    myRole: 'member',
    memberCount: 3,
    createdAt: '2026-06-01T10:00:00.000Z',
    ...over,
  }
}

function renderCard(g: ICustomerGroupSummary) {
  render(
    <MemoryRouter>
      <GroupCard group={g} to="/shop/groups/g1" />
    </MemoryRouter>,
  )
}

describe('GroupCard', () => {
  it('shows the name, member count and join code', () => {
    renderCard(group({ name: 'Flat 3B', memberCount: 4 }))
    expect(screen.getByText('Flat 3B')).toBeInTheDocument()
    expect(screen.getByText('4 members')).toBeInTheDocument()
    expect(screen.getByText('FAM-7Q2K9X4P')).toBeInTheDocument()
  })

  it('singularises a solo group and badges the owner', () => {
    renderCard(group({ myRole: 'owner', memberCount: 1 }))
    expect(screen.getByText('1 member')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
  })

  it('marks an archived group', () => {
    renderCard(group({ status: 'archived' }))
    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
  })
})
