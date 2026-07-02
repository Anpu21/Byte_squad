import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useCreateBrand } from '../hooks/useCreateBrand'
import { useUpdateBrand } from '../hooks/useUpdateBrand'
import type { IBrand } from '@/types'

interface BrandFormModalProps {
  editing: IBrand | null
  onClose: () => void
}

export function BrandFormModal({ editing, onClose }: BrandFormModalProps) {
  const isEdit = editing !== null
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [color, setColor] = useState(editing?.color ?? '')
  const [sortOrder, setSortOrder] = useState(String(editing?.sortOrder ?? 0))
  const [error, setError] = useState<string | undefined>(undefined)

  const createMutation = useCreateBrand()
  const updateMutation = useUpdateBrand()
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
      updateMutation.mutate({ id: editing.id, payload }, { onSuccess: onClose })
    } else {
      createMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit brand' : 'Add brand'}
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
          placeholder="e.g. Coca-Cola"
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
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add brand'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
