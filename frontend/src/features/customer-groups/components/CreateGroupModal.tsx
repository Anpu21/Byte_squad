import { useEffect, useState, type FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string) => void | Promise<void>
  isPending: boolean
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: CreateGroupModalProps) {
  const [name, setName] = useState('')

  // Reset the field each time the modal opens — intentional sync on open.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) setName('')
  }, [isOpen])
  /* eslint-enable react-hooks/set-state-in-effect */

  const trimmed = name.trim()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmed || isPending) return
    void onSubmit(trimmed)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a group" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group name"
          placeholder="e.g. Home, Flat 3B, Office snacks"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoFocus
        />
        <p className="text-xs text-text-3">
          You&apos;ll be the owner and get a code to invite others.
        </p>
        <div className="flex justify-end gap-2.5 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!trimmed || isPending}>
            {isPending ? 'Creating…' : 'Create group'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
