import { useState } from 'react'
import { Archive, Pencil, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useConfirm } from '@/hooks/useConfirm'
import { useCategoriesQuery } from '../hooks/useCategoriesQuery'
import { useArchiveCategory } from '../hooks/useArchiveCategory'
import { CategoryFormModal } from './CategoryFormModal'
import type { ICategory } from '@/types'

interface CategoryManageTabProps {
  isAdmin: boolean
}

export function CategoryManageTab({ isAdmin }: CategoryManageTabProps) {
  // Include archived rows so admins can see (and the table reflects) the full set.
  const { data: categories = [], isLoading } = useCategoriesQuery(true)
  const archive = useArchiveCategory()
  const confirm = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ICategory | null>(null)

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (category: ICategory) => {
    setEditing(category)
    setModalOpen(true)
  }
  const handleArchive = async (category: ICategory) => {
    const ok = await confirm({
      title: 'Archive category',
      body: `Archive "${category.name}"? Products keep their category, but it will be hidden from new selections.`,
      confirmLabel: 'Archive',
    })
    if (ok) archive.mutate(category.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-2">
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </p>
        <Button onClick={openAdd} size="sm">
          <Plus size={14} /> Add category
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-3 py-8 text-center">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-text-3 py-8 text-center">No categories yet.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-3 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Name</th>
                <th className="text-left font-semibold px-4 py-2.5">Description</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
                <th className="text-right font-semibold px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-border">
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 font-medium text-text-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: category.color ?? 'var(--text-3)' }}
                      />
                      {category.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-2">
                    {category.description ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        category.isActive ? 'text-text-1' : 'text-text-3'
                      }
                    >
                      {category.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil size={13} /> Edit
                      </Button>
                      {isAdmin && category.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleArchive(category)}
                        >
                          <Archive size={13} /> Archive
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CategoryFormModal
          editing={editing}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
