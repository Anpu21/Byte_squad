import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { IGroupCartItemView } from '@/types'
import { GroupCartRow } from '../GroupCartRow'

function item(over: Partial<IGroupCartItemView> = {}): IGroupCartItemView {
    return {
        id: 'i1',
        productId: 'p1',
        productName: 'Basmati Rice',
        imageUrl: null,
        branchId: 'b1',
        branchName: 'Colombo',
        unitId: null,
        unitLabel: '5kg bag',
        unitPrice: 2500,
        quantity: 2,
        amount: null,
        lineTotal: 5000,
        available: true,
        addedByUserId: 'u1',
        ...over,
    }
}

function renderRow(it: IGroupCartItemView) {
    const onSetQty = vi.fn()
    const onRemove = vi.fn()
    render(<GroupCartRow item={it} onSetQty={onSetQty} onRemove={onRemove} />)
    return { onSetQty, onRemove }
}

describe('GroupCartRow', () => {
    it('shows the product, branch, unit and line total, and steps quantity', () => {
        const { onSetQty } = renderRow(item())
        expect(screen.getByText('Basmati Rice')).toBeInTheDocument()
        expect(screen.getByText(/Colombo/)).toBeInTheDocument()
        expect(screen.getByText(/5kg bag/)).toBeInTheDocument()
        // Currency symbol/spacing is ICU-dependent — assert the amount portion.
        expect(screen.getByText(/5,000\.00/)).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', { name: 'Increase quantity' }),
        )
        expect(onSetQty).toHaveBeenCalledWith('i1', 3)
        fireEvent.click(
            screen.getByRole('button', { name: 'Decrease quantity' }),
        )
        expect(onSetQty).toHaveBeenCalledWith('i1', 1)
    })

    it('removes the line', () => {
        const { onRemove } = renderRow(item())
        fireEvent.click(
            screen.getByRole('button', { name: 'Remove Basmati Rice' }),
        )
        expect(onRemove).toHaveBeenCalledWith('i1')
    })

    it('hides the stepper for an unavailable product but still allows removal', () => {
        renderRow(item({ available: false }))
        expect(screen.getByText('Unavailable')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Increase quantity' }),
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /Remove/ }),
        ).toBeInTheDocument()
    })

    it('shows a derived quantity (no stepper) for a buy-by-amount line', () => {
        renderRow(item({ amount: 1000, quantity: 0.4, lineTotal: 1000 }))
        expect(screen.getByText('≈ 0.4')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Increase quantity' }),
        ).not.toBeInTheDocument()
    })
})
