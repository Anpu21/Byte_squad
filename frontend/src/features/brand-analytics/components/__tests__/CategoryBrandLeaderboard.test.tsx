import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CategoryBrandLeaderboard } from '../CategoryBrandLeaderboard'

const { comparison } = vi.hoisted(() => ({
  comparison: {
    categoryId: 'c1',
    categoryName: 'Beverages',
    startDate: '',
    endDate: '',
    branchId: null,
    totalRevenue: 1500,
    totalUnits: 30,
    totalProfit: 600,
    totalTransactions: 9,
    marginPct: 40,
    brands: [
      {
        brandId: 'b1',
        brandName: 'Coca-Cola',
        color: '#e11d48',
        units: 20,
        revenue: 1000,
        profit: 400,
        transactions: 6,
        marginPct: 40,
        sharePct: 66.7,
      },
      {
        brandId: null,
        brandName: 'Unbranded',
        color: null,
        units: 10,
        revenue: 500,
        profit: 200,
        transactions: 3,
        marginPct: 40,
        sharePct: 33.3,
      },
    ],
  },
}))

vi.mock('../../hooks/useCategoryComparison', () => ({
  useCategoryComparison: () => ({ data: comparison, isLoading: false }),
}))
// Charts need a sized container in jsdom; stub them — this test covers the table.
vi.mock('@/components/charts/BarChart', () => ({
  default: () => <div data-testid="bar-chart" />,
}))
vi.mock('@/components/charts/DonutChart', () => ({
  default: () => <div data-testid="donut-chart" />,
}))

describe('CategoryBrandLeaderboard', () => {
  it('renders every brand row including the Unbranded bucket', () => {
    render(
      <CategoryBrandLeaderboard
        categoryId="c1"
        params={{ startDate: '', endDate: '' }}
      />,
    )
    expect(screen.getByText('Coca-Cola')).toBeTruthy()
    // Null-brandId products collapse into a labelled Unbranded row.
    expect(screen.getByText('Unbranded')).toBeTruthy()
    expect(screen.getByText('66.7%')).toBeTruthy()
  })
})
