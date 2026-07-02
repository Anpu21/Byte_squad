import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrandManageTab } from '../BrandManageTab'

const { brands } = vi.hoisted(() => ({
  brands: [
    {
      id: 'b1',
      name: 'Coca-Cola',
      description: 'Soft drinks',
      color: '#e11d48',
      isActive: true,
      sortOrder: 0,
      createdByUserId: null,
      createdAt: '',
      updatedAt: '',
      productCount: 3,
    },
    {
      id: 'b2',
      name: 'Legacy Brand',
      description: null,
      color: null,
      isActive: false,
      sortOrder: 1,
      createdByUserId: null,
      createdAt: '',
      updatedAt: '',
      productCount: 0,
    },
  ],
}))

vi.mock('../../hooks/useBrandsQuery', () => ({
  useBrandsQuery: () => ({ data: brands, isLoading: false }),
}))
vi.mock('../../hooks/useArchiveBrand', () => ({
  useArchiveBrand: () => ({ mutate: vi.fn() }),
}))
vi.mock('../../hooks/useDeleteBrand', () => ({
  useDeleteBrand: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}))

describe('BrandManageTab', () => {
  it('renders each brand with its product count and an add button', () => {
    render(<BrandManageTab isAdmin />)
    expect(screen.getByText('Coca-Cola')).toBeTruthy()
    expect(screen.getByText('Legacy Brand')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByRole('button', { name: /add brand/i })).toBeTruthy()
  })

  it('disables delete for a brand still referenced by products', () => {
    render(<BrandManageTab isAdmin />)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    // Coca-Cola (3 products) → disabled; Legacy Brand (0 products) → enabled.
    expect(
      deleteButtons.some((b) => (b as HTMLButtonElement).disabled),
    ).toBe(true)
    expect(
      deleteButtons.some((b) => !(b as HTMLButtonElement).disabled),
    ).toBe(true)
  })

  it('hides archive and delete actions from non-admins', () => {
    render(<BrandManageTab isAdmin={false} />)
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /archive/i })).toBeNull()
  })
})
