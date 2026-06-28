import { useEffect, useState, type FormEvent } from 'react'
import { LuArchive as Archive } from 'react-icons/lu'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface GroupSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  onRename: (name: string) => void | Promise<void>
  onArchive: () => void | Promise<void>
  saving: boolean
}

export function GroupSettingsModal({
  isOpen,
  onClose,
  currentName,
  onRename,
  onArchive,
  saving,
}: GroupSettingsModalProps) {
  const [name, setName] = useState(currentName)

  // Re-seed the name field to the current group name when the modal opens.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) setName(currentName)
  }, [isOpen, currentName])
  /* eslint-enable react-hooks/set-state-in-effect */

  const trimmed = name.trim()
  const dirty = trimmed.length > 0 && trimmed !== currentName

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!dirty || saving) return
    void onRename(trimmed)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Group settings" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoFocus
        />
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-3">
          Danger zone
        </p>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className="text-sm text-text-2">
            Archive hides the group for everyone.
          </p>
          <Button
            type="button"
            variant="danger"
            onClick={() => void onArchive()}
            disabled={saving}
          >
            <Archive size={16} /> Archive
          </Button>
        </div>
      </div>
    </Modal>
  )
}
