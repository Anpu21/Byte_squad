import { useEffect, useState, type FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface JoinGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (code: string) => void | Promise<void>
  isPending: boolean
  initialCode?: string
}

export function JoinGroupModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  initialCode = '',
}: JoinGroupModalProps) {
  const [code, setCode] = useState(initialCode)

  // Re-seed from the (possibly prefilled) code each time the modal opens.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) setCode(initialCode)
  }, [isOpen, initialCode])
  /* eslint-enable react-hooks/set-state-in-effect */

  const trimmed = code.trim().toUpperCase()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmed || isPending) return
    void onSubmit(trimmed)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join a group" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Join code"
          placeholder="e.g. FAM-7Q2K9X4P"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-mono tracking-wider"
          autoFocus
        />
        <p className="text-xs text-text-3">
          Ask a group member for the code, or open the invite link they shared.
        </p>
        <div className="flex justify-end gap-2.5 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!trimmed || isPending}>
            {isPending ? 'Joining…' : 'Join group'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
