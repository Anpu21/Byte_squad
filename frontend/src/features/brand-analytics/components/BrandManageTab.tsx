import { useState } from 'react'
import {
  LuArchive as Archive,
  LuPencil as Pencil,
  LuPlus as Plus,
  LuTrash2 as Trash,
} from 'react-icons/lu'
import {
  Button,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@/components/ui'
import { useConfirm } from '@/hooks/useConfirm'
import { useBrandsQuery } from '../hooks/useBrandsQuery'
import { useArchiveBrand } from '../hooks/useArchiveBrand'
import { useDeleteBrand } from '../hooks/useDeleteBrand'
import { BrandFormModal } from './BrandFormModal'
import type { IBrand } from '@/types'

interface BrandManageTabProps {
  isAdmin: boolean
}

export function BrandManageTab({ isAdmin }: BrandManageTabProps) {
  // Include archived rows so the manage table reflects the full set.
  const { data: brands = [], isLoading } = useBrandsQuery(true)
  const archive = useArchiveBrand()
  const del = useDeleteBrand()
  const confirm = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<IBrand | null>(null)

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (brand: IBrand) => {
    setEditing(brand)
    setModalOpen(true)
  }
  const handleArchive = async (brand: IBrand) => {
    const ok = await confirm({
      title: 'Archive brand',
      body: `Archive "${brand.name}"? Products keep their brand, but it will be hidden from new selections.`,
      confirmLabel: 'Archive',
    })
    if (ok) archive.mutate(brand.id)
  }
  const handleDelete = async (brand: IBrand) => {
    const ok = await confirm({
      title: 'Delete brand',
      body: `Permanently delete "${brand.name}"? This can't be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (ok) del.mutate(brand.id)
  }

  const columns: DataTableColumn<IBrand>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (brand) => (
        <span className="inline-flex items-center gap-2 font-medium text-text-1">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: brand.color ?? 'var(--text-3)' }}
          />
          {brand.name}
        </span>
      ),
    },
    {
      key: 'desc',
      header: 'Description',
      className: 'text-text-2',
      render: (brand) => brand.description ?? '—',
    },
    {
      key: 'products',
      header: 'Products',
      align: 'right',
      numeric: true,
      render: (brand) => (brand.productCount ?? 0).toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (brand) => (
        <span className={brand.isActive ? 'text-text-1' : 'text-text-3'}>
          {brand.isActive ? 'Active' : 'Archived'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (brand) => {
        const inUse = (brand.productCount ?? 0) > 0
        return (
          <div className="flex justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => openEdit(brand)}>
              <Pencil size={13} /> Edit
            </Button>
            {isAdmin && brand.isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleArchive(brand)}
              >
                <Archive size={13} /> Archive
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                disabled={inUse}
                title={
                  inUse
                    ? `Used by ${brand.productCount} product(s) — archive instead`
                    : undefined
                }
                onClick={() => void handleDelete(brand)}
              >
                <Trash size={13} /> Delete
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-2">
          {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
        </p>
        <Button onClick={openAdd} size="sm">
          <Plus size={14} /> Add brand
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={brands}
          getRowKey={(brand) => brand.id}
          isLoading={isLoading}
          zebra
          clientPaginate={{ unit: 'brands' }}
          empty={<EmptyState title="No brands yet" />}
        />
      </div>

      {modalOpen && (
        <BrandFormModal editing={editing} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
