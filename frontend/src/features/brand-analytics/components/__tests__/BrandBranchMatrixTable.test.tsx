import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { IBrandBranchRow } from '@/types'
import { buildBrandMatrixRows } from '../../lib/brand-branch-data'
import { BrandBranchMatrixTable } from '../BrandBranchMatrixTable'

const BRANCHES = [
  { branchId: 'br-1', branchName: 'Colombo' },
  { branchId: 'br-2', branchName: 'Kandy' },
]

const ROWS: IBrandBranchRow[] = [
  {
    brandId: 'b1',
    brandName: 'Prima',
    color: '#e11d48',
    units: 10,
    revenue: 1000,
    profit: 200,
    transactions: 4,
    marginPct: 20,
    sharePct: 66.7,
    // Sold in Colombo only — Kandy must render a genuine zero, not a blank.
    perBranch: [{ branchId: 'br-1', revenue: 1000, units: 10, profit: 200 }],
  },
  {
    brandId: null,
    brandName: 'Unbranded',
    color: null,
    units: 5,
    revenue: 500,
    profit: 50,
    transactions: 2,
    marginPct: 10,
    sharePct: 33.3,
    perBranch: [{ branchId: 'br-2', revenue: 500, units: 5, profit: 50 }],
  },
]

function renderTable(onSelectBrand = vi.fn()) {
  const matrixRows = buildBrandMatrixRows(ROWS, BRANCHES, 'revenue')
  render(
    <BrandBranchMatrixTable
      rows={matrixRows}
      branches={BRANCHES}
      metric="revenue"
      branchColorFor={() => '#123456'}
      format={(v) => `Rs ${v}`}
      onSelectBrand={onSelectBrand}
      isLoading={false}
    />,
  )
  return onSelectBrand
}

describe('BrandBranchMatrixTable', () => {
  it('renders every branch column and genuine zero cells', () => {
    renderTable()
    expect(screen.getByText('Colombo')).toBeTruthy()
    expect(screen.getByText('Kandy')).toBeTruthy()
    // Prima's Kandy cell and Unbranded's Colombo cell are real zeros.
    expect(screen.getAllByText('Rs 0')).toHaveLength(2)
    // Once in the Colombo column, once in the Total column.
    expect(screen.getAllByText('Rs 1000')).toHaveLength(2)
  })

  it('drills into a brand row but keeps the Unbranded bucket inert', () => {
    const onSelectBrand = renderTable()

    fireEvent.click(screen.getByText('Prima'))
    expect(onSelectBrand).toHaveBeenCalledWith('b1')

    onSelectBrand.mockClear()
    fireEvent.click(screen.getByText('Unbranded'))
    expect(onSelectBrand).not.toHaveBeenCalled()
  })

  it('labels the Unbranded row as non-drillable for screen readers', () => {
    renderTable()
    expect(
      screen.getByLabelText('Unbranded products (no drill-down)'),
    ).toBeTruthy()
    expect(
      screen.getByLabelText('View Prima products per branch'),
    ).toBeTruthy()
  })
})
