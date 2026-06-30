import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JoinGroupModal } from '../JoinGroupModal'

describe('JoinGroupModal', () => {
  it('disables submit until a code is entered, then submits it upper-cased', () => {
    const onSubmit = vi.fn()
    render(
      <JoinGroupModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    const submit = screen.getByRole('button', { name: 'Join group' })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Join code'), {
      target: { value: 'fam-7q2k9x4p' },
    })
    expect(submit).toBeEnabled()

    fireEvent.click(submit)
    expect(onSubmit).toHaveBeenCalledWith('FAM-7Q2K9X4P')
  })

  it('prefills an invite code and submits it without retyping', () => {
    const onSubmit = vi.fn()
    render(
      <JoinGroupModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isPending={false}
        initialCode="FAM-ABCD1234"
      />,
    )

    expect(screen.getByLabelText('Join code')).toHaveValue('FAM-ABCD1234')
    fireEvent.click(screen.getByRole('button', { name: 'Join group' }))
    expect(onSubmit).toHaveBeenCalledWith('FAM-ABCD1234')
  })
})
