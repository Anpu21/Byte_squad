import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useCreateCategory } from '../hooks/useCreateCategory'
import { useUpdateCategory } from '../hooks/useUpdateCategory'
import type { ICategory } from '@/types'

interface CategoryFormModalProps {
  editing: ICategory | null
  onClose: () => void
}

export function CategoryFormModal({ editing, onClose }: CategoryFormModalProps) {
  const isEdit = editing !== null
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [color, setColor] = useState(editing?.color ?? '')
  const [sortOrder, setSortOrder] = useState(String(editing?.sortOrder ?? 0))
  const [error, setError] = useState<string | undefined>(undefined)

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const isSaving = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }
    const payload = {
      name: trimmed,
      description: description.trim() || undefined,
      color: color.trim() || undefined,
      sortOrder: Number(sortOrder) || 0,
    }
    if (isEdit && editing) {
      updateMutation.mutate(
        { id: editing.id, payload },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Category' : 'Add Category'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          error={error}
          onChange={(e) => {
            setName(e.target.value)
            setError(undefined)
          }}
          placeholder="e.g. Beverages"
          autoFocus
        />
        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Colour (optional)"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#3b82f6"
          />
          <Input
            label="Sort order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add category'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
